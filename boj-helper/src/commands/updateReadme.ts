import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { storedProblemsAt, problemsToMarkdown } from "../libs/problems"
import { Config } from "../libs/config";
import { visualizeStatistics } from './visStatitstics';
import { refineMeta } from "../libs/utils"


export async function updateReadme(config:Config){
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('작업폴더가 없습니다. 문제를 생성할 폴더 (problems의 상위 폴더)에서 수행하세요.');
        return;
    }

    // refineMeta()

    let wd = workspaceFolders[0].uri.fsPath
    const PATHS: { [key: string]: string } = {
        newlySolved: wd,
        solved : path.join(wd, "problems"),
        readme : path.join(wd, "README.md"),
    };

    const problems = storedProblemsAt(PATHS.solved, "").concat(storedProblemsAt(PATHS.newlySolved, PATHS.solved))

    vscode.window.showInformationMessage(`UPDATE README: Get solved problems. ${problems.length} problems solved.`)

    problems.sort((a, b) => {
        return  new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    const tableDate = problemsToMarkdown(problems, PATHS.solved)

    // sort by level 
    problems.sort((a, b) => {
        return b.tier.level - a.tier.level;
    });
    const tableLevel =  problemsToMarkdown(problems, PATHS.solved)
    vscode.window.showInformationMessage(`UPDATE README: ${PATHS.readme}`)    
    vscode.window.showInformationMessage('UPDATE README: Visualize statistics')
    // vis 
    await visualizeStatistics(config)
    fs.writeFileSync(PATHS.readme, `# BOJ-Archive \n![이미지 대체 텍스트](./profile/profile.svg) \n## 날짜 순 정렬\n${tableDate}\n\n## 난이도 별 정렬\n${tableLevel}\n`)
    console.log("UPDATE README: Done")

    vscode.window.showInformationMessage(`README.md가 업데이트 되었습니다.: ${PATHS.readme}`)

}