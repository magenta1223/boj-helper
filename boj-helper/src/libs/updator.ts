import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import stringify from 'json-stringify-pretty-compact';

import * as utils from '../libs/utils'


export const updatorFuncs:Function[] = []
export const ver2idx:{[key:string]: number} = {}
let idx = 0 


export function update(version:number){
    let a = Math.floor(version/10000)
    version -= a*10000 
    let b = Math.floor(version/100)
    version -= b*100 

    let verStr = `${a}.${b}.${version}`


    if (verStr in ver2idx){
        updatorFuncs[ver2idx[verStr]]()
    } 
}

function getExistingFiles(problemDir:string){
    return new Set(
        fs.readdirSync(problemDir).filter(file => {
            let fullPath = path.join(problemDir, file);
            return fs.lstatSync(fullPath).isDirectory() && file.includes("번");
        }));
}


ver2idx['0.0.0'] = idx++;
updatorFuncs.push( 
    function(){
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }
        let problemDir = path.join(workspaceFolders[0].uri.fsPath, "problems")

        let allProblems = getExistingFiles(problemDir)
        console.log(allProblems)
        allProblems.forEach((dir, index) => {
            let mdpath = path.join(problemDir, dir, "metadata.json")
            let metadata = JSON.parse(fs.readFileSync(mdpath).toString('utf-8'))
            fs.writeFileSync(mdpath, stringify(metadata, {
                indent: 4,
            }));

        })
    }
)


ver2idx['0.1.12'] = idx++;
updatorFuncs.push( 
    function(){
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }
        let problemDir = path.join(workspaceFolders[0].uri.fsPath, "problems")
        let allProblems = getExistingFiles(problemDir)
    
        allProblems.forEach((index, problem) => {
            let problemPath = path.join(problemDir, `${problem}`, `${problem}.md`)
            let markdown = fs.readFileSync(problemPath).toString()
            markdown = markdown.replaceAll("\\(", "$").replaceAll("\\)", "$").replace(utils.specialSpacesRegex, ' ').replaceAll(" \\", "\\")
            
            fs.writeFileSync(problemPath, markdown, {
                encoding:'utf-8'
            })
        })
    }

    // image 이슈.. 는 귀찮으니 나중에 ~  
)

