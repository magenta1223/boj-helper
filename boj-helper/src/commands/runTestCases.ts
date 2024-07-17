import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as utils from "../libs/utils"
import { Config } from "../libs/config"
import { spawnSync } from 'child_process';
import { getProblemPath } from '../libs/problems';


export async function runTestCases(config:Config){

    // 1. 문제 번호를 입력받고 
    const problemNumber = await vscode.window.showInputBox({ prompt: '문제 번호를 입력하세요.' });
    if (!problemNumber) {
        vscode.window.showErrorMessage("문제 번호가 입력되지 않았습니다.")
        return;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('작업폴더가 없습니다. 문제를 생성할 폴더 (problems의 상위 폴더)에서 수행하세요.');
        return;
    }
    

    // 2. 문제가 존재하는지 확인
    // const workingDirectory = workspaceFolders[0].uri.fsPath
    // let problem =  fs.readdirSync(workingDirectory).filter(file => {
    //     let fullPath = path.join(workingDirectory, file);
    //     return fs.lstatSync(fullPath).isDirectory() && file.includes(`${problemNumber}번`);
    // }).map(dir => {
    //     return path.join(workingDirectory, dir);
    // })


    // if (problem.length === 0){
    //     let problemsPath = path.join(workingDirectory, "problems")
    //     problem =  fs.readdirSync(problemsPath).filter(file => {
    //         let fullPath = path.join(problemsPath, file);
    //         return fs.lstatSync(fullPath).isDirectory() && file.includes(`${problemNumber}번`);
    //     }).map(dir => {
    //         return path.join(problemsPath, dir);
    //     })

    //     if (problem.length === 0){
    //         vscode.window.showErrorMessage(`${problemNumber}번 문제가 존재하지 않습니다.`)
    //         return ; 
    //     }
    // }


    const workingDirectory = workspaceFolders[0].uri.fsPath

    let problemPath = getProblemPath(workingDirectory, problemNumber)


    if (problemPath === ""){
        vscode.window.showErrorMessage(`${problemNumber}번 문제가 존재하지 않습니다.`)
        return ; 
    }

    let scriptPath = path.join(problemPath, `${path.basename(problemPath)}.${utils.getFileExt(config.language)}`);
    let testCases = fs.readFileSync(path.join(problemPath, "testCases.txt"), "utf-8").split("\n")

    // 2. testCases.txt 파일이 input, output 쌍이 맞는지 확인 
    let {res, nTestCases, Inputs, Outputs} = validateTestCases(testCases)
    if (!res){
        vscode.window.showErrorMessage(`${nTestCases}번째 테스트 케이스의 양식이 맞지 않습니다.`)
        return ;
    } 

    let results = []
    // 3. 각각의 testCase를 수행 
    for (let i = 0; i < nTestCases; i++) {
        const startT = process.hrtime();
        const res = spawnSync(config.language, [scriptPath], {
            input: Inputs[i]+"\n",
            encoding:"utf-8",
            timeout:150000,
        })

        
        const err = res.stderr.trim().replace(/\r/g, '');
        const output = res.stdout.trim().replace(/\r/g, '');
        const endT = process.hrtime(startT);

        results.push({
            "success": output === Outputs[i],
            "duration" :  `${((endT[0]*1000) + (endT[1]/1000000)).toFixed(3)} ms`
            
        
        })
    }

    const terminals = vscode.window.terminals;
    let terminal: vscode.Terminal;
    if (terminals.length > 0) {
        terminal = terminals[0]; // 첫 번째 터미널을 선택
    } else {
        terminal = vscode.window.createTerminal(`cmd`);
        terminal.show();
    }

    
    let terminalOutput:string = '(';
    results.forEach((result, index) => {
        terminalOutput += `echo Test case ${index + 1}: & echo    Success: ${result.success} & echo    Duration: ${result.duration} & `
    });

    terminalOutput = terminalOutput.slice(0,-2)
    terminalOutput += ')'
    terminal.sendText(terminalOutput)
}


function validateTestCases(lines:string[]) {  
  
    let expectingInput = true;  
    let i = 0;let nTestCases = 0;let errorPairing = false 

    let Inputs:string[] = []
    let Outputs:string[] = []

    while (i < lines.length){
        let line = lines[i].trim()
        let res:string = ""
        if (line === ""){
            i ++;
            continue
        }
        
        if ((expectingInput && line!=="Input:(")){
            Inputs = [];Outputs = [];
            nTestCases ++;
            errorPairing = true;
            break;
        } else if (!expectingInput && line!=="Output:("){
            Inputs = [];Outputs = [];
            errorPairing = true; 
            break 
        }


        while (i < lines.length && line !== ")"){
            i ++;
            line = lines[i].trim()
            if (line !== ")"){
                res += line + "\n"
            }
        }

        if (expectingInput){
            nTestCases ++;
            Inputs.push(res.slice(0,-1))
        } else {
            Outputs.push(res.slice(0,-1))
        }

        i++;
        expectingInput = !expectingInput
    }
    let res = !expectingInput || errorPairing?false:true

    return {res, nTestCases, Inputs, Outputs};

  }