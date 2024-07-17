import { updatorFuncs } from "../libs/updator";


import * as vscode from 'vscode';
import { Config } from "../libs/config"


export async function updateProjects(config:Config){

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    // 1. 현재 버전 가져오기 

    // 2. 기존 버전과 비교 

    // 3. 다르다면 기존 버전 초과 ~ 현재 버전 이하의 모든 updatorFuncs를 순차적으로 적용 




}