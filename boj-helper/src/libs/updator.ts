import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import stringify from 'json-stringify-pretty-compact';

// 

export const updatorFuncs:{[key:string]: Function} = {}



function getExistingFiles(problemDir:string){
    return new Set(
        fs.readdirSync(problemDir).filter(file => {
            let fullPath = path.join(problemDir, file);
            return fs.lstatSync(fullPath).isDirectory() && file.includes("번");
        }));
}


updatorFuncs['0.0.0'] = function(){
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

    })
}


updatorFuncs['0.1.10'] = function(){
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return [];
    }
    let problemDir = path.join(workspaceFolders[0].uri.fsPath, "problems")

    let allProblems = getExistingFiles(problemDir)

    // 1. markdown 파일 전부 읽어와서
    // 2. 공백문자 바꾸고
    // 3. 수식으로 변경 

    

}