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


const scale = 3 
const width = 900*scale;
const height = 300*scale;
const radius = 100*scale; // Math.min(width, height) / 2 - margin 

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
    const userInfo = await getUserInfo(config.bojID)
    const {agg, raw} = getData()
    const browser = await puppeteer.launch({
        executablePath: config.chromePath, 
    });

    vscode.window.showInformationMessage(`vis: browser on`)

    const page = await browser.newPage();

    // const d3Path = path.resolve(__dirname, 'node_modules', 'd3', 'dist', 'd3.min.js'); // D3.js 파일 경로 설정
    // <script src="https://d3js.org/d3.v7.min.js" async></script>
    // <link href="https://cdn.jsdelivr.net/npm/noto-sans-kr@0.1.1/styles.min.css" rel="stylesheet" async>



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

    // 지금 evaluate에서 제대로 작동을 안함.
    // evaluate 부분을 그냥 script로 적어버리고 
    // agg, raw, radius 등 변수를 page로 보내버리면 됨. 


    // const d3Path = process.env.NODE_ENV === 'development'
    //     ? path.resolve(__dirname, "../src/resources/js/d3.min.js")
    //     : path.resolve(__dirname, "./src/resources/js/d3.min.js")
    // const d3Content = fs.readFileSync(d3Path, 'utf8');
    // await page.evaluate(d3Content);

    vscode.window.showInformationMessage(`setting content`)
    await page.setContent(content);

    vscode.window.showInformationMessage(`start evaluate`)
    const svgString = await page.evaluate((scale, agg, raw, radius, width, height, userInfo, config, NameColors) => {
        
        const addText = (text:string, start:number, fontsize:number) => {
            let textEl = svg.append("text")
            textEl
                .attr('x', start)
                .attr('y', 50*scale)
                .text(text)
                .style('text-anchor', 'left')
                .style('font-size', fontsize)
                .style('color', 'black')
                .style('font-family', 'Noto Sans, sans-serif')
                .style("font-weight", "bold")

            let textWidth = textEl.node()?.getBBox().width
            return textWidth?start+textWidth+textMargin:0
        }

        const setColors = () => {
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
                .attr('rx', 20*scale) 
                .attr('ry', 20*scale)
        }

        // render donut chart 
        const drawDonut = (innerRadius:number, outerRadius:number, data:ParsedData[]) => {
            let arc = window.d3.arc<d3.PieArcDatum<{count:number, color: string,name:string}>>()
                .innerRadius(radius * innerRadius) // 도넛 차트의 내부 반지름
                .outerRadius(radius * outerRadius) // 도넛 차트의 외부 반지름
                .cornerRadius(30*scale)
                .padAngle(0.5 * Math.PI / 180);
            donutChart.selectAll('pieces')
                .data(pie(data))
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', d => d.data.color)
        }
        const getFill = (val:number) => {
            if (val === 0){
                return "#DDDFE0"
            } else if (val < 3){
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
            box.attr('rx', 5*scale).attr('ry', 5*scale)
                .attr('width', s).attr('height', s)
                .attr('fill', getFill(val))
                // .attr('x', x).attr('y', y)
                .attr('x', x-s/2).attr('y', y-s/2)
            return box
        }

        const getVal = (currentDate: Date, metadataArray: MetaData[]):number => {
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



        console.log("start")
        // svg 
        const svg = window.d3.select('svg')
        const textMargin = 20*scale


        setColors()
        console.log("select svg")
        console.log("calc colors")

        let start = 20*scale
        start = addText(`${config.bojID}`, start, 40*scale)
        start = addText(`Solved: ${userInfo.solvedCount}`, start, 20*scale)
        start = addText(`Rating: ${userInfo.rating}`, start, 20*scale)
        start = addText(`Class: ${userInfo.userClass}`, start, 20*scale)

        const margin = 20*scale
        let donutChart = svg.append('g')
            .attr("transform", `translate(${margin+radius},${(height-margin-radius)})`);
        let pie = window.d3.pie<{ count:number, color: string, name:string }>()
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
        

        // vscode.window.showInformationMessage(`render streak`)


        "#F7F8F9"
        // const streak = svg.append('g')
        //     .attr("transform", `translate(${2*radius+3*margin},${(height-2*radius+margin)})`);

        

        let bgX = 2*radius+2*margin; let bgY = height-2*radius-margin

        const streakBG = svg.append('rect')
            .attr("transform", `translate(${bgX},${(bgY)})`)
            .attr('width', width-3*margin-2*radius).attr('height', 2*radius)
            .attr('rx', 20*scale) 
            .attr('ry', 20*scale)
            .style('fill', "#F7F8F9")
            .style('opacity', 0.8)

        svg.append('text')
            .attr("transform", `translate(${bgX},${(bgY)})`)
            .attr('x', margin*0.7)
            .attr('y', margin*1.1)
            .text("Streak")
            .style('text-anchor', 'left')
            .style('dominant-baseline', 'middle')
            .style('font-size', 18*scale)
            .style('color', 'black')
            .style('font-family', 'Noto Sans, sans-serif')
            .style("font-weight", "bold")

        // const streak = svg.append('g')
        //     .attr("transform", `translate(${2*radius+4*margin},${(height-2*radius+2*margin)})`);

        const streak = svg.append('g')
            .attr("transform", `translate(${bgX+margin},${bgY+2.3*margin})`);
        const s = 15*scale; const m = 4*scale


        const weekdays = ['S','M','T','W','T','F','S']
        for (let i=0;i<7;i++){
            let text = streak.append('text')
            text.text(weekdays[i])
                .attr('x', 0)
                .attr('y', (s+m)*i)
                .style('text-anchor', 'middle')
                .style('dominant-baseline', 'middle')
                .style('font-size', 14*scale)
                .style('color', 'black')
                .style('font-family', 'Noto Sans, sans-serif')
        }

        const today = new Date();
        const currentDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        currentDate.setDate(currentDate.getDate() + currentDate.getDay() === 0 ? 0 : 7 - currentDate.getDay());
        let week = 1
        let month = currentDate.getMonth()
        while (currentDate <= today) {
            for (let i=0; i<7;i++){
                let box = drawBox((s+m)*week, (s+m)*i, getVal(currentDate, raw))
                currentDate.setDate(currentDate.getDate() + 1); // 다음 날짜로 설정
                if (currentDate>today){
                    break 
                }
            }
            console.log(currentDate)

            if (currentDate.getMonth() !== month){
                month = currentDate.getMonth()
                let text = streak.append('text')
                text.text(`${month+1}월`)
                    .attr('x', (s+m)*week)
                    .attr('y', (s+m)*7)
                    .style('text-anchor', 'middle')
                    .style('dominant-baseline', 'hanging')
                    .style('font-size', 14*scale)
                    .style('color', 'black')
                    .style('font-family', 'Noto Sans, sans-serif')
            }

            week += 1
        }



        // 1. legend

        // 2. 몰라 


        console.log("done")

        const svgElement = document.getElementById('svg');
        
        console.log(svgElement ? new XMLSerializer().serializeToString(svgElement) : null)

        return svgElement ? new XMLSerializer().serializeToString(svgElement) : null;
    }, scale, agg, raw, radius, width, height, userInfo, config, NameColors);

    // await page.close()
    // await browser.close()
    return svgString;
}

