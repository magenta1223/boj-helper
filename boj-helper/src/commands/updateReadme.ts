import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as utils from '../libs/utils'
import { storedProblemsAt, problemsToMarkdown, MetaData } from "../libs/problems"
import { Config } from "../libs/config";
import { visualizeStatistics } from './visStatitstics';


export async function updateReadme(config:Config){
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('작업폴더가 없습니다. 문제를 생성할 폴더 (problems의 상위 폴더)에서 수행하세요.');
        return;
    }

    // refineMeta()

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Update README.md",
        cancellable: false 
    }, async (progress) => {
        
        const wd = workspaceFolders[0].uri.fsPath
        const PATHS: { [key: string]: string } = {
            newlySolved: wd,
            solved : path.join(wd, "problems"),
            solving : path.join(wd, "unsolved"),
            readme : path.join(wd, "README.md"),
        };

        const terminal = utils.initTerminal()
        terminal.sendText(`cd ${PATHS.newlySolved}`)

        // updating pass or fail 
        const problemStatus = await utils.getProblemStatus(config.bojID)

        // getting solved problems 
        // status에 pass or fail에 따라 다른 곳으로 보내야되는데 
        progress.report({ increment: 33, message: `Get solved problems..` });    



        const problems = storedProblemsAt(PATHS.solved, false, PATHS, problemStatus)
            .concat(storedProblemsAt(PATHS.newlySolved, true, PATHS, problemStatus))
            .concat(storedProblemsAt(PATHS.solving, true, PATHS, problemStatus))
            
        // problems를 solved여부에 따라 분리 
        const solved:MetaData[] = []
        const solving:MetaData[] = []
        problems.forEach((metadata) => {
            if (metadata.solved){
                solved.push(metadata)
            } else {
                solving.push(metadata)
            }
        })

        // processing problems 
        progress.report({ increment: 33, message: `Processing problems..` });
        const tableDate = problemsToMarkdown(
            solved.slice().sort((a, b) => {
                return  new Date(b.date).getTime() - new Date(a.date).getTime();
            }), 
            PATHS.solved
        )        
        const tableLevel = problemsToMarkdown(
            solved.sort((a, b) => {
                return b.tier.level - a.tier.level;
            }),
            PATHS.solved
        )
        
        const tableSolving = problemsToMarkdown(
            solving.slice().sort((a, b) => {
                return  new Date(b.date).getTime() - new Date(a.date).getTime();
            }), 
            PATHS.solved
        )

    
        // vis
        progress.report({ increment: 34, message: `Visualize statistics` });
        await visualizeStatistics(config)
        fs.writeFileSync(PATHS.readme, `# BOJ-Archive \n![이미지 대체 텍스트](./profile/profile.svg) \n## 날짜 순 정렬\n${tableDate}\n\n## 난이도 별 정렬\n${tableLevel}\n\n## 시도했으나 못 푼 문제\n${tableSolving}`)
        
        vscode.window.showInformationMessage(`README.md가 업데이트 되었습니다. ${PATHS.readme}`)

    });
}