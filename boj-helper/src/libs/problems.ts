import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import * as utils from "./utils"
import * as vscode from "vscode"
import stringify from 'json-stringify-pretty-compact';

export interface TierInfo {
    name: string;
    abb:string;
    nameColor:string;
    abbColor:string;
    svg: string;
    level:number;
}

export interface MetaData {
    name:string;
    title:string;
    problemNumber:string;
    date:string;
    tier:TierInfo
}

export interface Problem {
    html: string;
    title: string;
    markdown:string;
    metadata:MetaData;
    errorMsg:string;
    testCases:string
}

export interface testCase {
    input:string,
    output:string
}


export const NameColors = [
    "#9D4900", "#A54F00", "#AD5600", "#B55D0A", "#C67739",
    "#38546E", "#3D5A74", "#435F7A", "#496580", "#4E6A86",
    "#D28500", "#DF8F00", "#EC9A00", "#F9A518", "#FFB028", 
    "#00C78B", "#00D497", "#27E2A4", "#3EF0B1", "#51FDBD", 
    "#009EE5", "#00A9F0", "#00B4FC", "#2BBFFF", "#41CAFF",
    "#E0004C", "#EA0053", "#F5005A", "#FF0062", "#CE3D38"
]

export const AbbColors = [
    "#AD5600",
    "#435F7A",
    "#EC9A00",
    "#27E2A4",
    "#00B4FC",
    "#F5005A"
]

export const tierNames = [
    "Unrated",
    "Bronze V", "Bronze IV", "Bronze III", "Bronze II", "Bronze I",
    "Silver V", "Silver IV", "Silver III", "Silver II", "Silver I",
    "Gold V", "Gold IV", "Gold III", "Gold II", "Gold I",
    "Platinum V", "Platinum IV", "Platinum III", "Platinum II", "Platinum I",
    "Diamond V", "Diamond IV", "Diamond III", "Diamond II", "Diamond I",
    "Ruby V", "Ruby IV", "Ruby III", "Ruby II", "Ruby I",
];

export async function createProblem(bojID:string, problemNumber:string,language:string, openWebView:boolean,code:string, submitTime:string){
    const problemUrl = `https://www.acmicpc.net/problem/${problemNumber}`;
    const problem = await getProblem(problemNumber, problemUrl);

    // 문제 생성 
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('작업폴더가 없습니다. 문제를 생성할 폴더 (problems의 상위 폴더)에서 수행하세요.');
        return;
    }

    if (submitTime !== ""){
        problem.metadata.date = submitTime
    }

    const PATHS: { [key: string]: string } = {
        "folder":   path.join(workspaceFolders[0].uri.fsPath, openWebView? "":"problems" , problem.title),
    };
    PATHS["file"]=     path.join(PATHS.folder, `${problem.title}.${utils.getFileExt(language)}`);
    PATHS["markdown"]= path.join(PATHS.folder, `${problem.title}.md`);
    PATHS["testCases"]= path.join(PATHS.folder, `testCases.txt`);
    PATHS["metadata"]= path.join(PATHS.folder, `metadata.json`);

    if (!fs.existsSync(PATHS.folder)) {
        fs.mkdirSync(PATHS.folder);
    }

    if (!fs.existsSync(PATHS.file)) {
        fs.writeFileSync(PATHS.file, generateProblemFiles(bojID, problem, utils.getCommentSymbols(language), code));
        fs.writeFileSync(PATHS.markdown, problem.markdown);
        fs.writeFileSync(PATHS.testCases, problem.testCases);
        fs.writeFileSync(PATHS.metadata, stringify(problem.metadata, {
            indent: 4,
        }));
    } else {
        vscode.window.showErrorMessage(`파일이 이미 존재합니다: ${PATHS.file}`);
    }

    if (openWebView){
        const panel = vscode.window.createWebviewPanel(
            'problemWebView', 
            `${problem.title}`, 
            vscode.ViewColumn.One, 
            {}
        );
        panel.webview.html = problem.html 
        const uri = vscode.Uri.file(PATHS.file);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Two });
    }

}


export async function getProblem(problemNumber:string, url: string): Promise<Problem> {
    try {
        // fetch html according to problemNumber 
        let response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            },
        });

        let $ = cheerio.load(response.data.toString("utf-8"));        
        let {name, title, tier, testCases, desiredContent} = await getContent(problemNumber, $)
        let html = generateHtml(desiredContent)
        let markdown = getMarkdown(desiredContent)
        markdown = markdown.replace(`\n\n## <img`, " - <img")//.replace(title, `${title} - <img src="${tier.svg}" style="height:20px" /> ${tier.name}`)

        let metadata = {
            name: name,
            title:title,
            problemNumber: problemNumber,
            date:new Date().toISOString().slice(0, 19).replace('T', ' '), // timezone issue 
            tier: tier 
        }
        let errorMsg = ""
        return {html, title, markdown, metadata, testCases, errorMsg};

    } catch (error) {
        console.error(`Error fetching the URL ${url}:`, error);

        let html = "";let title = "";let markdown = "";
        let tier = {name:"", abb:"", nameColor :"", abbColor : "", svg:"", level:0};
        let metadata = {name:"", title:"", problemNumber:"", date:"", tier: tier};
        let testCases = ""
        let errorMsg = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);

        return {html, title, markdown, metadata, testCases, errorMsg}
    }
}

async function getContent(problemNumber:string, $:cheerio.CheerioAPI){
    let name = utils.cleanTitle($('#problem_title').text())
    let title = `${problemNumber}번： ${name}`
    let tier = await getTier(problemNumber)

    // clean html 
    $('button').each((i, elem) => {$(elem).remove();});
    $('span.problem-label').each((i, elem) => {$(elem).remove();});
    $('[class*=col-md-]').each((i, elem) => {
        let classes = $(elem).attr('class')?.split(' ') || [];
        let updatedClasses = classes.map(cls => cls.replace('col-md-', 'col-sm-'));
        $(elem).attr('class', updatedClasses.join(' '));
    });
    $('div.page-header').replaceWith(`
        <div class="page-header">
            <h1 style="display: inline; margin-right: 10px;">
                ${title}
            </h1>
            <h2 style="display: inline;">
                <img src="${tier.svg}" class="solvedac-tier" style="vertical-align: middle; margin-left: 5px;">
                <span>${tier.name}</span>
            </h2>
        </div>
    `)

    let content = $('body > div.wrapper > div.container.content > div.row');
    content.find('img').each((index, img) => {
        let src = $(img).attr('src');
        if (src && src.startsWith('/')) {
            $(img).attr('src', 'https://www.acmicpc.net' + src);
        }
    });

    // test case 

    // 1. id가 sample-input X -> tc로 만들면 된다.
    // 1. pre.sample-data인 모든 요소를 찾고
    // 2. 두 개 단위로 끊는다. 
    // 3. 첫 번째를 input, 두 번째를 output으로 지정 

    let sampleInputs = $('[id^=sample-input-]')
    let sampleOutputs = $('[id^=sample-output-]')
    let testCases:string = ""
    
    for (let i=0;i<sampleInputs.length;i++){
        let input = $(sampleInputs[i]).html() || ""
        let output = $(sampleOutputs[i]).html() || ""
        // testCases.push({
        //     input: input.replace(/\n$/, ''),
        //     output: output.replace(/\n$/, '')
        // })
        testCases += `Input:(\n${input})\n\nOutput:(\n${output})\n\n`
    }


    let desiredContent = content.children('div').slice(2).toArray().map(elem => $.html(elem)).join('');
    return {name, title, tier, testCases, desiredContent}
}

function generateHtml(desiredContent:string){
    let bootstrapCss = fs.readFileSync(
        process.env.NODE_ENV === 'development'
            ? path.resolve(__dirname, '../src/resources/bootstrap/css/bootstrap.css')
            : path.resolve(__dirname, './src/resources/bootstrap/css/bootstrap.css'),
        'utf-8'
    );

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Modified Page</title>
            <link rel="stylesheet" href="https://ddo7jzca0m2vt.cloudfront.net/css/problem-font.css?version=20230101">
            <link rel="stylesheet" href="https://ddo7jzca0m2vt.cloudfront.net/unify/css/custom.css?version=20230101">
            <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
            
            <style>
                ${bootstrapCss}
            </style>
            <style>
                body {
                    background-color: #1f1f1f;
                    color: #cccccc;
                }
                h1, h2, h3 { margin-top: 20px; }

                [id^=sample-] {
                    background-color: #4f4f4f !important; /* Override background color */
                    color: #cccccc;
                    }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/core.min.js" integrity="sha512-Vj8DsxZwse5LgmhPlIXhSr/+mwl8OajbZVCr4mX/TcDjwU1ijG6A15cnyRXqZd2mUOQqRk4YbQdc7XhvedWqMg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
        </head>
        <body>
            ${desiredContent || ''}
        </body>
        </html>
    `;
}

function getMarkdown(desiredContent:string){
    const $ = cheerio.load(`<body>${desiredContent}</body>`);
    return utils.HTM($, $('body')[0])
}

async function getTier(problemNumber: string): Promise<TierInfo> {
    try {
        let tier = await axios.get(`https://solved.ac/api/v3/problem/show?problemId=${problemNumber}`, {
            headers: { Accept: "application/json" },
        });
        let level = tier.data.level;
        let name = tierNames[level];
        let svg = `https://static.solved.ac/tier_small/${level}.svg`;
        level = parseInt(level)
        return {
            name : name, 
            abb : name[0],
            nameColor: NameColors[level],
            abbColor : AbbColors[Math.floor(level / 5)],
            svg:svg, 
            level : level, 
        }
    } catch (error) {
        console.error(`Error fetching tier info for problem ${problemNumber}:`, error);
        throw error;
    }
}

export function generateProblemFiles(boj_id: string, problem:Problem, commentSymbol:{left:string, right:string}, code:string):string{
    const leftSymbol = commentSymbol["left"]
    const rightSymbol =  commentSymbol["right"]
    const LEFT = `${leftSymbol}  ***********************************************
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}                                                 
${leftSymbol}  ***********************************************`;

    const RIGHT = `***************************  ${rightSymbol}
                             ${rightSymbol}
      :::    :::    :::      ${rightSymbol}
     :+:    :+:      :+:     ${rightSymbol}
    +:+    +:+        +:+    ${rightSymbol}
   +#+    +#+          +#+   ${rightSymbol}
  +#+      +#+        +#+    ${rightSymbol}
 #+#        #+#      #+#     ${rightSymbol}
###          ###   ##.kr     ${rightSymbol}
                             ${rightSymbol}
***************************  ${rightSymbol}`;

    let left = LEFT.split("\n");
    let right = RIGHT.split("\n");
    const symbolLen = leftSymbol.length

    let problemNumber = problem.metadata.problemNumber
    let date = problem.metadata.date

    left[3] = `${leftSymbol}     Problem Number: ${problemNumber}`.padEnd(49+symbolLen);
    left[5] = `${leftSymbol}     By: ${boj_id} <boj.kr/u/${boj_id}>`.padEnd(49+symbolLen);
    left[7] = `${leftSymbol}     https://boj.kr/${problemNumber}`.padEnd(49+symbolLen);
    left[8] = `${leftSymbol}     Solved: ${date} by ${boj_id}`.padEnd(49+symbolLen);
    const header = left.map((l, index) => l + (right[index] || '')).join('\n');
    return header + `\n\n${code}`
}

export function storedProblemsAt(problemPath:string, moveTo:string): MetaData[]{
    let problemDirs = fs.readdirSync(problemPath).filter(folder => folder.includes("번："));
    let problems: MetaData[] = []
    for (let problem of problemDirs) {
        let metadataPath = path.join(problemPath, problem, "metadata.json");
        let pDir = path.join(problemPath, problem);
        if (fs.existsSync(metadataPath)) {
            problems.push(JSON.parse(fs.readFileSync(metadataPath, 'utf8')))
            if (moveTo){
                utils.moveFolder(pDir, path.join(moveTo, problem))
            }
        }
    }
    return problems 
}

export function problemsToMarkdown(problems:MetaData[], problemPath:string):string{
    let mdTable = ''
    const columns:string[] = ["번호", "이름", "링크", "코드", "날짜"]
    mdTable += `| ${columns.join(' | ')} |\n`;
    mdTable += `| ${columns.map(() => '---').join(' | ')} |\n`;

    problems.forEach((metadata, index) => {
        let source = path.join("./problems", metadata.title, `${metadata.title}.py`).replaceAll(' ', '%20').replaceAll('\\', '/')
        let rows:string[] = [
            `${metadata.problemNumber} 번`,
            `<img src="${metadata.tier.svg}" style="height:20px"> ${metadata.name}`,
            `[문제링크](https://boj.kr/${metadata.problemNumber})`,
            `[소스코드](./${source})`,
            metadata.date.slice(0,10),
        ]
        mdTable += `| ${rows.join(' | ')} |\n`;
    })
    return mdTable 
}