import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { fetchProblem, getProblemPath, createProblem } from '../libs/problems';
import { Config } from "../libs/config"

export async function openProblem(config:Config){    
    const problemNumber = await vscode.window.showInputBox({ prompt: '문제 번호를 입력하세요.' });
    if (!problemNumber) {
        vscode.window.showErrorMessage("문제 번호가 입력되지 않았습니다.")
        return;
    }
    const problemUrl = `https://www.acmicpc.net/problem/${problemNumber}`;
    const problem = await fetchProblem(problemNumber, problemUrl);

    if (problem.errorMsg !== ""){
        vscode.window.showErrorMessage(`문제가 발생했습니다. ${problem.errorMsg}`)
    } else {

        // 1. 문제가 존재하는지 확인
        // 2. 문제가 
        // 2-1) 존재: markdown 파일 열기
        // 2-2) 부재: create하고 markdown파일 열기 
        
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('작업폴더가 없습니다. 문제를 생성할 폴더 (problems의 상위 폴더)에서 수행하세요.');
            return;
        }

        const workingDirectory = workspaceFolders[0].uri.fsPath
        let problemPath = getProblemPath(workingDirectory, problemNumber)

        if (problemPath === ""){
            createProblem(config.bojID, problemNumber, config.language, false, "", "")
        }

        problemPath = getProblemPath(workingDirectory, problemNumber)

        // open 
        const markdownUri = vscode.Uri.file(path.join(problemPath, `${path.basename(problemPath)}.md`));
        const docMd = await vscode.workspace.openTextDocument(markdownUri);
        await vscode.window.showTextDocument(docMd, { viewColumn: vscode.ViewColumn.One });
        await vscode.commands.executeCommand('markdown.showPreview', markdownUri);

        await vscode.window.showTextDocument(docMd, { preview:false });
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');


        

            

        // const panel = vscode.window.createWebviewPanel(
        //     'problemWebView', 
        //     `${problem.title}`, 
        //     vscode.ViewColumn.One, 
        //     {}
        // );
        // panel.webview.html = problem.html 
    }
};

