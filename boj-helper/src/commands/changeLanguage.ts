import * as vscode from 'vscode';
import { setLang } from '../libs/config'

export async function changeLanguage(){
    // check workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    // config의 언어를 변경! 
    const config = vscode.workspace.getConfiguration('boj-helper');
    await setLang(config, "")
}