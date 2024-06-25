import * as cheerio from 'cheerio';
import axios from 'axios';
import exp from 'constants';


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

export function htmlToMarkdown(html: string): string {
    const $ = cheerio.load(html);
    let markdown = '';

    const prefix: Record<string, string> = {
        'p' : '',
        'h1' : '# ',
        'h2' : '## ',
        'h3' : '### ',
        'li' : '- ',
        [Symbol.iterator]: "[Symbol.iterator]"
    }

    $('*').each((index, element) => {
        if (element.type == "tag"){
            let $el = $(element)
            const tagName = element.name.toLocaleLowerCase()
            let text = $el.text().replaceAll("\n", "").trim()
            let pText = "";
            $el.contents().each((_, elem) => {
                if (elem.type === 'text') {
                    pText += $(elem).text();
                } else if (elem.type === "tag"){
                    if (elem.name === 'sub') {
                        pText += `<sub>${$(elem).text()}</sub>`;
                    } else if (elem.name === 'a') {
                        let aHref = $(elem).attr('href');
                        let aText = $(elem).text();
                        pText += `[${aText}](${aHref})`;
                    } else if (elem.name === "code"){
                        pText += `<code>${$(elem).text()}</code>`;
                    }
                }
            });


            let display:boolean = true;
            let currentElement = $el;
            while (currentElement.length > 0) {
                let styleAttr = currentElement.attr('style');
                if (styleAttr && styleAttr.includes('display: none;')) {
                    display = false;
                }
                currentElement = currentElement.parent();
            }

            if (!display){
            } else if (tagName === "table"){
                const table = $('#problem-info');            
                const headers = table.find('thead th');
                const headerTexts: string[] = [];
                
                headers.each((index, element) => {
                    headerTexts.push($(element).text().trim());
                });
                markdown += `| ${headerTexts.join(' | ')} |\n`;
                markdown += `| ${headerTexts.map(() => '---').join(' | ')} |\n`;
            
                const rows = table.find('tbody tr');
                rows.each((index, row) => {
                    const cols = $(row).find('td');
                    const colTexts: string[] = [];
                    cols.each((index, col) => {
                        colTexts.push($(col).text().trim());
                    });
                    markdown += `| ${colTexts.join(' | ')} |\n`;
                });
            } else {
                switch (tagName) {
                    case 'p':
                    case 'li':
                        markdown += `${prefix[tagName]}${pText}\n\n`;
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                        markdown += `${prefix[tagName]}${text}\n\n`;
                        break;
                    case 'pre':
                        markdown += `<pre>${$el.html()}</pre>\n`;
                        break; 
                    case 'blockquote':
                        markdown += '> ' + text.trim().replace(/\n/g, '\n> ') + '\n\n';
                        break;
                    case 'br':
                        markdown += '\n';
                        break;
                    default:                        
                        break; 
                }
            } 
        }
    });
    return markdown.trim(); // Markdown 결과의 앞뒤 공백을 제거하여 반환합니다.
}


export async function getUserInfo(boj_id:string): Promise<{solvedCount:number, rating:number, userClass:number,tier:number}>{
    // let tier = await axios.get(`https://solved.ac/api/v3/problem/show?problemId=${problemNumber}`, {
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


