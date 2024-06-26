import * as vscode from 'vscode';
import axios from 'axios';
import simpleGit, { SimpleGit } from 'simple-git';
import * as path from "path"
import * as fs from "fs"
import { reporters } from 'mocha';

export interface Config{
    bojID:string;
    language:string;
    gitUsername:string;
    gitEmail:string;
    gitAddress:string;
    workingDirectory:string;
    chromePath:string;
}


export async function getConfig(){
    const config = vscode.workspace.getConfiguration('boj-helper');

    let bojID = config.get<string>('BOJID', '');
    let language = config.get<string>('language', '');
    let gitUsername = config.get<string>('gitUsername', '');
    let gitEmail = config.get<string>('gitEmail', '');
    let gitAddress = config.get<string>('gitAddress', '');
    let chromePath = config.get<string>('chromePath', '');

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("여기?")
        throw "workspace error"
    }




    let workingDirectory = workspaceFolders[0].uri.fsPath

    const git: SimpleGit = simpleGit(workingDirectory);

    if (!bojID){
        while (!bojID){
            let _bojID = await vscode.window.showInputBox({prompt:"Baekjoon Online Judge의 ID를 입력해주세요. 기존에 작성한 문제 수집 및 성능평가에 사용됩니다."})
            // 존재하는지 확인 
            try {
                let response = await axios.get(`https://www.acmicpc.net/user/${_bojID}`,{
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    },
                });
                console.log(response.data)
                if (_bojID !== undefined && response.status >= 200 && response.status < 300){
                    bojID = _bojID
                } else {
                    vscode.window.showErrorMessage(`${_bojID}는 존재하지 않는 계정입니다.`)
                }
            } catch (error) {
                vscode.window.showErrorMessage("ID 존재 여부 확인 중 에러가 발생했습니다.")
            }
        }

        vscode.window.showInformationMessage(`$Baekjoon Online Judge ID가 ${bojID}로 설정되었습니다.`)
        config.update("BOJID", bojID)
    }

    if (!language){
        while (!language){
            let _language = await vscode.window.showInputBox({prompt:"프로그래밍 언어가 설정되지 않았습니다. python, cpp, c, java, rust 중 하나를 입력해주세요."})
            _language = _language?.toLowerCase()
            if (_language && _language in ['python', 'cpp', 'c', 'java', 'rust']){
                language = _language
            } else {
                vscode.window.showErrorMessage(`${_language}는 유효하지 않은 언어입니다.`)
            }
        }
        vscode.window.showInformationMessage(`프로그래밍 언어가 ${language}로 설정되었습니다.`)
        config.update("language", language)
    } 

    if (!gitUsername){
        while (!gitUsername){
            let _gitUsername = await vscode.window.showInputBox({prompt:"git username을 입력하세요"})
            if (_gitUsername !== undefined){
                gitUsername = _gitUsername
            } else {
                vscode.window.showErrorMessage(`${_gitUsername}는 유효하지 않은 언어입니다.`)
            }
        }
        vscode.window.showInformationMessage(`git username이 ${gitUsername}로 설정되었습니다.`)
        // utils.executeCommand(`git config --global user.name ${gitUsername}`, workingDirectory)
        git.addConfig('user.name', gitUsername)
        config.update("gitUsername", gitUsername)
    }

    if (!gitEmail){
        while (!gitEmail){
            let _gitEmail = await vscode.window.showInputBox({prompt:"git email을 입력하세요"})
            if (_gitEmail !== undefined){
                gitEmail = _gitEmail
            } else {
                vscode.window.showErrorMessage(`${_gitEmail}는 유효하지 않은 언어입니다.`)
            }
        }
        vscode.window.showInformationMessage(`git email이 ${gitEmail}로 설정되었습니다.`)
        // utils.executeCommand(`git config --global user.email ${gitEmail}`, workingDirectory)
        git.addConfig('user.email', gitEmail)
        config.update("gitEmail", gitEmail)
    }
    
    if (!gitAddress){
        while (!gitAddress){
            let _gitAddress = await vscode.window.showInputBox({prompt:"코드를 저장할 github repository의 주소를 입력하세요"})
            try {
                let response = await axios.get(`${_gitAddress}`, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                    },
                });
                if (_gitAddress !== undefined && response.status >= 200 && response.status < 300){
                    gitAddress = _gitAddress
                } else {
                    vscode.window.showErrorMessage(`${_gitAddress}는 유효하지 않은 저장소입니다.`)
                }
            } catch (error) {
                console.log(JSON.stringify(error))
                vscode.window.showErrorMessage(`저장소 존재 유무 확인 중 에러가 발생했습니다.`)
            }
        }
        vscode.window.showInformationMessage(`github 저장소가 ${gitAddress}로 설정되었습니다.`)
        // utils.executeCommand(`git init`, workingDirectory)
        // utils.executeCommand(`git remote add origin ${gitEmail}`, workingDirectory)
        git.init()
        git.addRemote('origin', gitAddress)
        config.update("gitAddress", gitAddress)
    }

    if (!chromePath){
        while (!chromePath){
            let _chromePath = await vscode.window.showInputBox({prompt:"chrome.exe의 경로를 입력하세요"})
            if (_chromePath) {
                if (!fs.existsSync(_chromePath)){
                    vscode.window.showErrorMessage(`${_chromePath}에 chrome.exe가 설치되어 있지 않습니다. Google Chrome을 설치해주세요.`)
                    throw "chromepath error"
                } else {
                    chromePath = _chromePath
                }
            }
        }
        config.update("chromePath", chromePath)
        if (!fs.existsSync(chromePath)){
            vscode.window.showErrorMessage(`${chromePath}에 chrome.exe가 설치되어 있지 않습니다. Google Chrome을 설치해주세요.`)
            throw "chromepath error"
        }
    }


    // TODO: workingDirectory에 gitAddress에 해당하는 repository가 있는가? 

    // 1. 현재 workingDirectory에 git init이 있는지 확인 -> 없다면 init 
    const gitDir = path.join(workingDirectory, ".git")
    if (!fs.existsSync(gitDir)){
        console.log("git 없음. 추가")
        await git.init()
    }
    const remotes = await git.getRemotes(true)
    if (remotes.length === 0){
        console.log("git remote 없음. 추가")
        await git.addRemote('origin', gitAddress)
    } else {
        const originRemote = remotes.find(remote => remote.name === 'origin')
        console.log("git remote", originRemote?originRemote.refs.fetch:"", gitAddress,)
        if (originRemote){
            if (originRemote.refs.fetch !== gitAddress) {
                console.log('remote가 있는데 다름.', `gitaddress : ${gitAddress}, 현재 remote: ${originRemote.refs.fetch}`)
                // remote가 있고 URL이 다른 경우
                fs.rmSync(gitDir, { recursive: true, force: true });
                console.log('git 삭제')
                await git.init();
                console.log('다시 init')
                await git.addRemote('origin', gitAddress);
                console.log('add origin')
            }
        } else {
            // origin remote가 없는 경우
            console.log('origin 없음. 추가')
            await git.addRemote('origin', gitAddress);
        }
    }
    git.pull('origin', 'master')




    return { bojID, language, gitUsername, gitEmail, gitAddress, workingDirectory, chromePath} 
}