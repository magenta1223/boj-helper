import * as vis from "../libs/vis"
import * as fs from "fs"
import * as path from "path"
import * as vscode from "vscode"
import { Config } from "../libs/config";
import formatter from 'xml-formatter';

export async function visualizeStatistics(config:Config){
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    let svg = await vis.renderSvg(config) 
    if (!svg){
        throw "error"
    }
    svg = formatter(svg, {
        indentation: '    ', // 인덴트 설정: 스페이스 두 칸
        collapseContent: true // 내용이 길면 한 줄로 합침
    });

    const visPath = path.join(workspaceFolders[0].uri.fsPath, "test.svg") 
    fs.writeFileSync(visPath, svg);


}