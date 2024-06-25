import * as vscode from "vscode"
import fs from 'fs';
import path from 'path';

import * as d3 from 'd3';
import puppeteer from 'puppeteer';

import { MetaData, NameColors, AbbColors } from './problems';
import { Config } from './config';
import { getUserInfo } from './utils';


interface ParsedData {
        count: number;
        color: string;
        name: string;
    }[];

const width = 928;
const height = 300;
const radius = 100; // Math.min(width, height) / 2 - margin 

function getData():{agg:{[key:string]: ParsedData[]}, raw:MetaData[]} {
    const agg: {[key: string]: {count: number, color: string, name:string }[]} = {}
    agg.abb = AbbColors.map(color => ({ count: 0, color, name:"" }));
    agg.detail = NameColors.map(color => ({ count: 0, color, name:"" }));
    const raw: MetaData[] = []; 
    const data = { agg, raw };

    const workSpace = vscode.workspace.workspaceFolders
    if (!workSpace){
        return data 
    }

    const baseDir = path.join(workSpace[0].uri.fsPath, "problems")
    const targetDirs = fs.readdirSync(baseDir).filter(dir => dir.includes('번'));
    targetDirs.forEach(dir => {
        const metadataPath = path.join(baseDir, dir, 'metadata.json');
        try {
            let metadata: MetaData = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            data.agg.abb[Math.floor(metadata.tier.level/5)].count += 1 
            data.agg.abb[Math.floor(metadata.tier.level/5)].name = metadata.tier.abb 
            data.agg.detail[metadata.tier.level].count += 1 
            data.agg.detail[metadata.tier.level].name = metadata.tier.name 
            data.raw.push(metadata)
        } catch (error) {
            console.error(`Error reading ${metadataPath}: ${JSON.stringify(error)}`);
        }
    });
    return data;
}


export async function renderSvg(config:Config){
    // const chromePath = process.env.NODE_ENV === 'development'
    //     ? path.resolve(__dirname, '../src/resources/chromium/chrome.exe')
    //     : path.resolve(__dirname, './resources/chromium/chrome.exe');


    const userInfo = await getUserInfo(config.bojID)
    const {agg, raw} = getData()
    const browser = await puppeteer.launch({
        executablePath: config.chromePath, 
    });
    const page = await browser.newPage();
    const content = `
        <html>
        <head>
            <script src="https://d3js.org/d3.v7.min.js"></script>
            <link href="https://cdn.jsdelivr.net/npm/noto-sans-kr@0.1.1/styles.min.css" rel="stylesheet">
        </head>
        <body>
            <svg id="svg" width="${width}" height="${height}">
                <defs>
                    <linearGradient id="ffflux-gradient" gradientTransform="rotate(360, 0.5, 0.5)" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop id="stop1" stop-color="#00C78B" stop-opacity="1" offset="0%"/>
                        <stop id="stop2" stop-color="#51FDBD" stop-opacity="1" offset="100%"/>
                    </linearGradient>
                    <filter id="ffflux-filter" x="-20%" y="-20%" width="140%" height="140%" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feTurbulence type="fractalNoise" baseFrequency="0.002 0.007" numOctaves="2" seed="2" stitchTiles="stitch" x="0%" y="0%" width="100%" height="100%" result="turbulence"/>
                        <feGaussianBlur stdDeviation="0 0" x="0%" y="0%" width="100%" height="100%" in="turbulence" edgeMode="duplicate" result="blur"/>
                        <feBlend mode="screen" x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" in2="blur" result="blend"/>
                        <feComponentTransfer>
                            <feFuncR type="linear" slope="0.75" />
                            <feFuncG type="linear" slope="0.75" />
                            <feFuncB type="linear" slope="0.75" />
                        </feComponentTransfer>
                    </filter>
                </defs>
            </svg>
        </body>
        </html>
    `;
    await page.setContent(content);

    const svgString = await page.evaluate((agg, raw, radius, width, height, userInfo, config, NameColors) => {
        const fontsize = 20;
        
        // svg 
        const svg = d3.select('svg')
        const textMargin = 20

        let colors = ["#ffffff", '#ffffff']
        if (userInfo.tier === 31){
            colors = ['#f97eaf', '#7ef5ff']
        } else {
            let _x = Math.floor((userInfo.tier-1)/5)
            colors = [NameColors[_x*5],  NameColors[_x*5+4]]
        }

        svg.select('stop1').attr('stop-color', colors[0]) // 1 
        svg.select('stop2').attr('stop-color', colors[1]) // 1 
        svg.append('rect').attr('width', width).attr('height', height)
            .attr('fill', 'url(#ffflux-gradient)')
            .attr('filter', 'url(#ffflux-filter)')
            .attr('rx', 20) // x 방향의 둥근 모서리 반지름
            .attr('ry', 20) // y 방향의 둥근 모서리 반지름

        const addText = (text:string, start:number, fontsize:number) => {
            let textEl = svg.append("text")
            textEl
                .attr('x', start)
                .attr('y', 50)
                .text(text)
                .style('text-anchor', 'left')
                .style('font-size', fontsize)
                .style('color', 'black')
                .style('font-family', 'Noto Sans, sans-serif')

            let textWidth = textEl.node()?.getBBox().width
            return textWidth?start+textWidth+textMargin:0
        }
        
        let start = 20 
        start = addText(`${config.bojID}`, start, 40)
        start = addText(`Solved: ${userInfo.solvedCount}`, start, 20)
        start = addText(`Rating: ${userInfo.rating}`, start, 20)
        start = addText(`Class: ${userInfo.userClass}`, start, 20)
 
        // render donut chart 
        const drawDonut = (innerRadius:number, outerRadius:number, data:ParsedData[]) => {
            let arc = d3.arc<d3.PieArcDatum<{count:number, color: string,name:string}>>()
                .innerRadius(radius * innerRadius) // 도넛 차트의 내부 반지름
                .outerRadius(radius * outerRadius) // 도넛 차트의 외부 반지름
                .cornerRadius(30)
                .padAngle(0.5 * Math.PI / 180);
            donutChart.selectAll('pieces')
                .data(pie(data))
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', d => d.data.color)
        }

        const margin = 20
        let donutChart = svg.append('g')
            .attr("transform", `translate(${margin+radius},${(height-margin-radius)})`);
        let pie = d3.pie<{ count:number, color: string, name:string }>()
            .sort(null)
            .value(d => d.count);
        drawDonut(0.8, 0.85, agg.detail)
        drawDonut(0.9, 1.0, agg.abb)
        // donutChart.selectAll('pieces')
        //     .data(pie((data.abb)))
        //     .enter()
        //     .append('text')
        //     .text(d => d.data.name)
        //     .attr('transform', d => `translate(${arcOuter.centroid(d)})`)
        //     .style('text-anchor', 'middle')
        //     .style('font-size', 15)
            // 생성된 SVG를 문자열로 변환하여 반환
        

        // streak 그리기
        // 1년치 
        // 왼쪽 요일
        // 각 월의 1일이 포함된 곳에 Month 표기  
        // 1-2, 3-6, 7-12, 13-19 
        
        const streak = svg.append('g')
            .attr("transform", `translate(${2*radius+3*margin},${(height-2*radius+margin)})`);

        
        
        const s = 15; const m = 4
        // 1. 박스 디자인 
        const getFill = (val:number) => {
            if (val < 3){
                return '#A1E4AC'
            } else if (val < 7) {
                return '#78CB94'
            } else if (val < 13) {
                return '#4EB17C'
            } else {
                return '#007950'
            }
        }

        const drawBox = (x:number,y:number,val:number) => {
            let box = streak.append('rect')
            box.attr('rx', 5).attr('ry', 5)
                .attr('x', x).attr('y', y)
                .attr('width', s).attr('height', s)
                .attr('fill', getFill(val))
            return box
        }

        function getVal(currentDate: Date, metadataArray: MetaData[]): number {
            let count = 0;
            let year=currentDate.getFullYear();let month=currentDate.getMonth();let day=currentDate.getDate()
            metadataArray.forEach(metadata => {
                const date = new Date(metadata.date);
                if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
                    count++;
                }
            });
            return count;
        }


        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        currentDate.setDate(currentDate.getDate() + currentDate.getDay() === 0 ? 0 : 7 - currentDate.getDay());
        let week = 0
        let month = currentDate.getMonth()
        while (currentDate <= today) {
            // 1. 요일, 주차 
            for (let i=0; i<7;i++){
                // left top 기준 
                let box = drawBox((s+m)*week, (s+m)*i, getVal(currentDate, raw))
                currentDate.setDate(currentDate.getDate() + 1); // 다음 날짜로 설정
                if (currentDate>today){
                    break 
                }
            }

            if (currentDate.getMonth() !== month){
                month = currentDate.getMonth()
                let text = streak.append('text')
                text.text(`${month+1}월`)
                    .attr('x', (s+m)*week+s/2)
                    .attr('y', (s+m)*7+s/2)
                    .style('text-anchor', 'middle')
                    .style('dominant-baseline', 'hanging')
                    .style('font-size', 15)
                    .style('color', 'black')
                    .style('font-family', 'Noto Sans, sans-serif')
            }

            week += 1
        }

        const weekdays = ['S','M','T','W','T','F','S']

        for (let i=0;i<7;i++){
            let text = streak.append('text')
            text.text(weekdays[i])
                .attr('x', -m-s)
                .attr('y', (s+m)*i+s*0.7)
                .style('text-anchor', 'right')
                .style('font-size', 15)
                .style('color', 'black')
                .style('font-family', 'Noto Sans, sans-serif')


        }




        // 2. 각 박스의
        // 크기: 5x5
        // margin: 3
        // 위치 -> 이건 계산
        // 


        const svgElement = document.getElementById('svg');
        
        console.log(svgElement ? new XMLSerializer().serializeToString(svgElement) : null)

        return svgElement ? new XMLSerializer().serializeToString(svgElement) : null;
    }, agg, raw, radius, width, height, userInfo, config, NameColors);

    await page.close()
    await browser.close()
    return svgString;
}
