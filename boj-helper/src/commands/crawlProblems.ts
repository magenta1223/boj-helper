import * as vscode from 'vscode';
import { Config } from "../libs/config"
import { Crawler } from '../libs/crawl';


export async function crawlSolvedProblems(config:Config){
    const bojPSWD = await vscode.window.showInputBox({ prompt: '소스코드 크롤링을 위한 비밀번호를 입력하세요.' });
    if (!bojPSWD) {
        vscode.window.showErrorMessage('비밀번호가 입력되지 않았습니다.');
        return;
    }    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    const crawler = new Crawler(config.bojID, bojPSWD, workspaceFolders[0].uri.fsPath, config.language, config.chromePath)
    await crawler.crawl()

}