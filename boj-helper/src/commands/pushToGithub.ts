import { updateReadme } from "./updateReadme";
import { Config } from "../libs/config";
import * as vscode from 'vscode';
import simpleGit, { SimpleGit } from 'simple-git';

export async function pushToGithub(config:Config){
    await updateReadme(config)
    let commit = await vscode.window.showInputBox({prompt: "커밋 메세지를 입력하세요."})
    const git: SimpleGit = simpleGit(config.workingDirectory);

    if (commit !== undefined){
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Pushing to github repository",
            cancellable: false 
        }, async (progress) => {
            try{
                progress.report({ increment: 33, message: `add..` });
                await git.add(".")
                progress.report({ increment: 33, message: `commit..` });
                await git.commit(commit)
                progress.report({ increment: 34, message: `pushing..` });
                await git.push("origin", "master")
                vscode.window.showInformationMessage(`${config.gitAddress}에 push가 완료되었습니다.`)
            } catch (error) {
                vscode.window.showErrorMessage(`push 도중 다음 에러가 발생했습니다. ${JSON.stringify(error)}`)
            }

        });
    } else {
        vscode.window.showErrorMessage("커밋 메세지를 입력하지 않았습니다.")
    }
}

