import * as vscode from 'vscode';
import { getProblem } from '../libs/problems';
import { Config } from "../libs/config"

export async function openProblem(config:Config){    
    const problemNumber = await vscode.window.showInputBox({ prompt: '문제 번호를 입력하세요.' });
    if (!problemNumber) {
        vscode.window.showErrorMessage("문제 번호가 입력되지 않았습니다.")
        return;
    }
    const problemUrl = `https://www.acmicpc.net/problem/${problemNumber}`;
    const problem = await getProblem(problemNumber, problemUrl);

    if (problem.errorMsg !== ""){
        vscode.window.showErrorMessage(`문제가 발생했습니다. ${problem.errorMsg}`)
    } else {
        const panel = vscode.window.createWebviewPanel(
            'problemWebView', 
            `${problem.title}`, 
            vscode.ViewColumn.One, 
            {}
        );
        panel.webview.html = problem.html 
    }
};

