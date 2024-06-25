import * as vscode from 'vscode';
import { createProblem } from '../libs/problems'
import { Config } from "../libs/config"


export async function createProblemFiles(config:Config){
    const problemNumber = await vscode.window.showInputBox({ prompt: '문제 번호를 입력하세요.' });
    if (!problemNumber) {
        vscode.window.showErrorMessage("문제 번호가 입력되지 않았습니다.")
        return;
    }

    vscode.window.showInformationMessage(`Create Problem: ${problemNumber}`)
    createProblem(problemNumber, config.language, true, "", "")
};

