import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';


const specialSpaces = [
    '\u0020',
    '\u00A0',
    '\u2000',
    '\u2001',
    '\u2002',
    '\u2003',
    '\u2004', 
    '\u2005',
    '\u2006',
    '\u2007',
    '\u2008',
    '\u2009',
    '\u200A', // Hair Space
    '\u200B', // Zero-width Space
    '\u2028',
    '\u205F',
    '\u3000',
    '\u2800'  // Braille Blank
  ];
const specialSpacesRegex = new RegExp(specialSpaces.join('|'), 'g');


export function getFileExt(language: string): string {
    const f_exts: { [key: string]: string } = {
        "python": "py",
        "cpp": "cpp",
        "c": "c",
        "java": "java",
        "rust": "rs"
    };

    if (language in f_exts) {
        return f_exts[language];
    } else {
        throw new Error(`Unsupported language: ${language}`);
    }
}

export function getCommentSymbols(language: string): {left:string, right:string} {
    const commentSymbols: { [key: string]: {left:string, right:string} } = {
        "python": {"left" : "#", "right": "#"},
        "c":      {"left" : "/*", "right": "*/"},
        "cpp":    {"left" : "/*", "right": "*/"},
        "java":   {"left" : "/*", "right": "*/"},
        "rust":   {"left" : "/*", "right": "*/"},
    };
    if (language in commentSymbols) {
        return commentSymbols[language];
    } else {
        return  {"left" : "/*", "right": "*/"};
    }
}

export function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function noise(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function cleanTitle(title:string):string{
    title = title.replace(/:/g, "：")
    .replace(/\*/g, "＊")
    .replace(/\?/g, "？")
    .replace(/"/g, "＂")
    .replace(/</g, "＜")
    .replace(/>/g, "＞")
    .replace(/\|/g, "｜")
    .replace(/\//g, "／")
    .replace(/\\/g, "＼")
    .replace(/\^/g, "＾");
    return title
}

export function cleanSourceCode(text: string): string {
    text = text.replace(/\u200b/g, ' ');    
    let match = text.search(/\D/);
    if (match !== -1){
        return text.slice(match)
    } else {
        return text 
    }
}

const MDprefix: Record<string, string> = {
    'h1' : '# ',
    'h2' : '## ',
    'h3' : '### ',
    'li' : '- ',
    [Symbol.iterator]: "[Symbol.iterator]"
}

function getPrefix(tagName:string){
    if (tagName in MDprefix){
        return MDprefix[tagName]
    } else {
        return ""
    }
}

export function HTM($:cheerio.CheerioAPI, el:cheerio.Element): string {
    let markdown = ""
    let $el = $(el)
    let tagName = el.name.toLocaleLowerCase()
    let text = $el.text().replaceAll("\n", "").trim().replaceAll("\\(", "$").replaceAll("\\)", "$").replace(specialSpacesRegex, ' ').replaceAll(" \\", "\\")
    let isHidden = $el.attr('style')?.includes('display: none') || false;
    
    if (isHidden){
        return markdown
    }
    
    // table 
    if (tagName === "table"){
        let table = $('#problem-info');            
        let headers = table.find('thead th');
        let headerTexts: string[] = [];
        headers.each((index, element) => {
            headerTexts.push($(element).text().trim());
        });
        markdown += `| ${headerTexts.join(' | ')} |\n`;
        markdown += `| ${headerTexts.map(() => '---').join(' | ')} |\n`;
    
        let rows = table.find('tbody tr');
        rows.each((index, row) => {
            let cols = $(row).find('td');
            let colTexts: string[] = [];
            cols.each((index, col) => {
                colTexts.push($(col).text().trim());
            });
            markdown += `| ${colTexts.join(' | ')} |\n`;
        });
        return markdown
    } 


    // no children 
    if ($el.children().length === 0){
        switch (tagName) {
            case 'p':
            case 'li':
            case 'h1':
            case 'h2':
            case 'h3':
                markdown = `${getPrefix(tagName)}${text}\n\n`;
                break;
            case 'pre':
                markdown = `<pre>${$el.html()}</pre>\n`;
                break; 
            case 'a':
                markdown = `[${text}](${$el.attr('href')})`;
                break; 
            case 'sub':
                markdown = `<sub>${text}</sub>`
                break; 
            case 'code':
                markdown = `<code>${text}</code>`;
                break;
            case 'blockquote':
                markdown += '> ' + text.trim().replace(/\n/g, '\n> ') + '\n\n';
                break;
            case 'br':
                markdown += '\n';
                break;
            case 'span':
                markdown += text; // 상위 태그가 반드시 존재
                break;
            case 'img':
                if ($el.attr('src')?.includes('solved.ac')){
                    markdown += `<img src="${$el.attr('src')}" style="height:20px" />`
                } else {
                    markdown += $el.html()
                }
                break; 
            default:                        
                break; 
        }
        return markdown 
    }

    markdown += getPrefix(tagName)
    $el.contents().each((i, content) => {
        if (content.type === "text"){
            markdown += $(content).text().trimStart()
        } else if (content.type === "tag"){
            markdown += HTM($, content);
        }
    });
    return markdown + '\n'
}


export async function getUserInfo(boj_id:string): Promise<{solvedCount:number, rating:number, userClass:number,tier:number}>{
    try{
        const userInfo = await axios.get(`https://solved.ac/api/v3/user/show/?handle=${boj_id}`, {
            headers: { Accept: "application/json"}
        })
        return {
            solvedCount :  userInfo.data.solvedCount,
            rating : userInfo.data.rating,
            userClass : userInfo.data.class,
            tier: userInfo.data.tier
        }
    } catch (error) {

        throw error
    }
}


export async function moveFolder(source: string, destination: string): Promise<void> {
    try {
        await fs.promises.mkdir(destination, { recursive: true });
        const entries = await fs.promises.readdir(source, { withFileTypes: true });
        for (const entry of entries) {
            const sourcePath = path.join(source, entry.name);
            const destinationPath = path.join(destination, entry.name);
            if (entry.isDirectory()) {
                await moveFolder(sourcePath, destinationPath);
            } else {
                await fs.promises.rename(sourcePath, destinationPath);
            }
        }
        await fs.promises.rmdir(source);
    } catch (error) {
        throw error;
    }
}

import stringify from 'json-stringify-pretty-compact';
import * as vscode from 'vscode';

function getExistingFiles(problemDir:string){
    return new Set(
        fs.readdirSync(problemDir).filter(file => {
            let fullPath = path.join(problemDir, file);
            return fs.lstatSync(fullPath).isDirectory() && file.includes("번");
        }));
}


export function refineMeta(){
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return [];
    }
    let problemDir = path.join(workspaceFolders[0].uri.fsPath, "problems")

    let allProblems = getExistingFiles(problemDir)

    allProblems.forEach((dir, index) => {
        let mdpath = path.join(problemDir, dir, "metadata.json")
        let metadata = JSON.parse(fs.readFileSync(mdpath).toString('utf-8'))
        fs.writeFileSync(mdpath, stringify(metadata, {
            indent: 4,
        }));
        fs.rmSync(path.join(problemDir, dir, "metadata2.json"))

    })
}


