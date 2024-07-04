import * as vscode from 'vscode';
import { getConfig } from "./libs/config"
import { openProblem } from "./commands/openProblem"
import { createProblemFiles } from "./commands/createProblem"
import { crawlSolvedProblems } from "./commands/crawlProblems"
import { updateReadme } from './commands/updateReadme';
import { pushToGithub } from './commands/pushToGithub';
import { runTestCases } from './commands/runTestCases'




export function activate(context: vscode.ExtensionContext) {

    let disposableOpenProblem = vscode.commands.registerCommand('onCommand.extension.openProblem', async () => {
        const config = await getConfig()
        await openProblem(config)
    });

    let disposableCreateProblemFiles = vscode.commands.registerCommand('onCommand.extension.createProblemFiles', async () => {
        // BOJ ID가 존재하는지 확인 
        const config = await getConfig()
        await createProblemFiles(config)
    });

    let disposableCrawlSolved = vscode.commands.registerCommand('onCommand.extension.crawlSolved', async () => {
        const config = await getConfig()
        await crawlSolvedProblems(config)
    });

    let disposableUpdateReadme = vscode.commands.registerCommand('onCommand.extension.updateReadme', async () => {
        const config = await getConfig()
        updateReadme(config)
    });

    let disposablePushToGithub = vscode.commands.registerCommand('onCommand.extension.pushToGithub', async () => {
        const config = await getConfig()
        await pushToGithub(config)
    })

    let disposableRunTestCases = vscode.commands.registerCommand('onCommand.extension.runTestCases', async () => {
        const config = await getConfig()
        await runTestCases(config)
    })


    context.subscriptions.push(disposableOpenProblem);
    context.subscriptions.push(disposableCreateProblemFiles);
    context.subscriptions.push(disposableCrawlSolved);
    context.subscriptions.push(disposableUpdateReadme);
    context.subscriptions.push(disposablePushToGithub);
    context.subscriptions.push(disposableRunTestCases);
    
}



export function deactivate() {}
