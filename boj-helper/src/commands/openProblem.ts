import * as vscode from 'vscode';
import * as path from 'path';
import { fetchProblem, getProblemPath, createProblem } from '../libs/problems';
import { Config } from "../libs/config"

export async function openProblem(config:Config){    
    const workingDirectory = config.workingDirectory
    const problemNumber = await vscode.window.showInputBox({ prompt: '문제 번호를 입력하세요.' });
    if (!problemNumber) {
        vscode.window.showErrorMessage("문제 번호가 입력되지 않았습니다.")
        return;
    }

    const problem = await fetchProblem(problemNumber, `https://www.acmicpc.net/problem/${problemNumber}`);
    if (problem.errorMsg !== ""){
        vscode.window.showErrorMessage(`문제를 가져올 수 없습니다. ${problem.errorMsg}`)
        return ;
    } 

    if (getProblemPath(workingDirectory, problemNumber) === ""){
        createProblem(config.bojID, problemNumber, config.language, false, "", "")
    }
    let problemPath = getProblemPath(workingDirectory, problemNumber)

    // open 
    const markdownUri = vscode.Uri.file(path.join(problemPath, `${path.basename(problemPath)}.md`));
    const docMd = await vscode.workspace.openTextDocument(markdownUri);
    await vscode.window.showTextDocument(docMd, { viewColumn: vscode.ViewColumn.One });
    await vscode.commands.executeCommand('markdown.showPreview', markdownUri);

    await vscode.window.showTextDocument(docMd, { preview:false });
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');


};

