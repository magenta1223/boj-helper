import * as vscode from 'vscode';
import * as cf from "../libs/config"

export async function getConfig(){
    // check workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is opened.');
        throw "";
    }
    const workingDirectory = workspaceFolders[0].uri.fsPath
    const config = vscode.workspace.getConfiguration('boj-helper');
    let language = config.get<string>('language', '');

    await cf.setBojID(config)
    await cf.setLang(config, language)
    await cf.setGithubRepository(config, workingDirectory)
    await cf.setChromePath(config)

    console.log(cf.parseConfig(config, workingDirectory))
    return cf.parseConfig(config, workingDirectory)
}