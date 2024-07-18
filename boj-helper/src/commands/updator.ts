import { update, ver2idx } from "../libs/updator";


import * as vscode from 'vscode';


function ver2num(version:string):number{
    let verSplit = version.split('.')        
    return parseInt(verSplit[0]) * 10000 + parseInt(verSplit[1]) * 100 + parseInt(verSplit[2])
}

export async function updateProjects(previousVersion:string){

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }


    // 3. 다르다면 기존 버전 초과 ~ 현재 버전 이하의 모든 updatorFuncs를 순차적으로 적용 
    
    // prev 이후 모든 updator funcs를 수행해야 함. 
    // 1. version을 넘버로 변환. 버전 자릿수 당 최대 100개를 넘지 않는다고 가정. 
    // 2. 그러면 ver2idx의 모든 key를 적절한 수로 변환 가능 
    // 3. prev초과의 모든 version을 추릴 수 있다. '

    const prevVersionNum = ver2num(previousVersion)

    const keys = Object.keys(ver2idx).map((ver, idx) => {
        return ver2num(ver)
    }).filter((verNum) => {
        return verNum > prevVersionNum
    });

    for (let i=0; i<keys.length;i++){
        console.log('update', keys[i])
        update(keys[i])
    }







}