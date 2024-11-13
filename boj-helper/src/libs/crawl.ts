import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import * as vscode from 'vscode';
import { createProblem } from './problems';
import * as utils from "./utils"


// Class Crawler using Puppeteer
export class Crawler {
    private readonly id: string;
    private readonly password: string;
    private readonly problemDir:string;
    private readonly delayms:number 
    private readonly language:string;
    private browser!:puppeteer.Browser; 
    private readonly chromePath:string;

    constructor(_id: string, _pswd: string, workingDirectory: string, language:string, chromePath:string) {
        this.id = _id;
        this.password = _pswd;
        this.problemDir = path.join(workingDirectory, "problems");
        this.delayms = 5000;
        this.language = language;
        this.chromePath = chromePath
    }

    async initBrowser(){
        this.browser = await puppeteer.launch({
            headless: false,
            executablePath: this.chromePath, 
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
              ],
        });
    } 

    async get(url:string){
        // vscode.window.showInformationMessage(`CRAWL: loading ${url}`)

        let page = await this.browser.newPage();
        await page.goto(url, {waitUntil:"load"})
        let content = await page.content();
        page.close()
        let $ = cheerio.load(content)
        return $ 
    }

    async clean() {
        const problemsDir = path.join(__dirname, 'problems');
        const problems = fs.readdirSync(problemsDir).map(file => path.join(problemsDir, file));

        for (const problem of problems) {
            if (fs.statSync(problem).isDirectory() && fs.readdirSync(problem).length < 2) {
                fs.rmdirSync(problem, { recursive: true });
            }
        }
    }

    async crawl(){
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Crawling",
            cancellable: true
        }, async (progress, token) => {
            let isCancelled = false 

            if (!fs.existsSync(this.problemDir)) {
                progress.report({ increment: 1, message: `Generating problems directory` });
                vscode.window.showInformationMessage(`${this.problemDir}가 생성되었습니다.`)
                fs.mkdirSync(this.problemDir);
            }

            progress.report({ increment: 1, message: `Open browser..` });
            if (token.isCancellationRequested) {
                vscode.window.showInformationMessage('작업이 취소되었습니다.');
                isCancelled = true 
            }
            if (!isCancelled){
                await this.initBrowser()
            }

            progress.report({ increment: 1, message: `Login..` });
            if (token.isCancellationRequested) {
                vscode.window.showInformationMessage('작업이 취소되었습니다.');
                isCancelled = true 
            }
            if (!isCancelled){
                await this.login()
            }
            
            progress.report({ increment: 1, message: `Get solved problems..` });
            if (token.isCancellationRequested) {
                vscode.window.showInformationMessage('작업이 취소되었습니다.');
                isCancelled = true 
            }
            let toBeUpdated:string[] = [];
            if (!isCancelled){
                toBeUpdated = await this.getSolvedProblems()
            }
            
            
            // await this.crawlSources(toBeUpdated)
            if (!isCancelled){
                const totalProblems = toBeUpdated.length;
                for (let i = 0; i < totalProblems; i++) {
                    if (token.isCancellationRequested) {
                        vscode.window.showInformationMessage('작업이 취소되었습니다.');
                        isCancelled = true;
                        // 이걸 이렇게 하지말고 에러 메세지를 리턴, 에러 처리 메소드로 ㄱㄱ 
                        break;
                    }
                    let num = toBeUpdated[i];
                    let increment = (1 / (totalProblems+3)) * 100;
                    progress.report({ increment: increment, message: `${i + 1} / ${totalProblems}: ${num}번 문제` });
                    let { lastAcSubmission, submitTime } = await this.getLastAcSubmission(num);
                    let sourceCode = await this.crawlCode(num, lastAcSubmission);
                    createProblem(this.id, num, this.language, false, sourceCode, submitTime);
                }
            }

            this.browser.close()
            if (isCancelled){
                vscode.window.showErrorMessage("작업이 취소되었습니다.")
            } else {
                vscode.window.showInformationMessage("작업이 완료되었습니다.")
            }
        })
    }

    async login() {
        const page = await this.browser.newPage();
        page.goto("https://www.acmicpc.net/login")
        await page.waitForSelector("#login_form")
        for (let i=0; i<this.id.length; i++){
            await page.type("#login_form > div:nth-child(2) > input", this.id[i]);   
            await utils.delay(75+utils.noise(0,100));
        }

        for (let i=0; i<this.password.length; i++){
            await page.type("#login_form > div:nth-child(3) > input", this.password[i]);   
            await utils.delay(75+utils.noise(0,100));
        }
        await utils.delay(1000+utils.noise(0,100))
        await Promise.all([
            page.click("#submit_button"),
            page.waitForNavigation()
        ]);

        // You need to manually solve CAPTCHA here
        await utils.delay(this.delayms);
    }

    async getSolvedProblems(): Promise<string[]>{
        let url =  `https://www.acmicpc.net/user/${this.id}`
        let allProblems = await this.getAllProblems(url)
        let existingFiles = this.getExistingFiles()
        let toBeUpdated = allProblems.filter(item => !existingFiles.has(item))
        return toBeUpdated 
    }

    async getAllProblems(url:string): Promise<string[]>{
        let target = 'body > div.wrapper > div.container.content > div.row > div:nth-child(2) > div > div.col-md-9 > div:nth-child(2) > div.panel-body > div > a'
        let $ = await this.get(url)
        let problems:string[] = []
        $(target).each((i, el) => {
            problems.push($(el).text().trim())
        })
        return problems
    }

    getExistingFiles(){
        return new Set(
            fs.readdirSync(this.problemDir).filter(file => {
                let fullPath = path.join(this.problemDir, file);
                return fs.lstatSync(fullPath).isDirectory() && file.includes("번");
            }).map(dir => {
                let index = dir.indexOf("번");
                let res = index > 0 ? dir.substring(0, index) : dir
                return res;
        }));
    }

    async getLastAcSubmission(num:string):Promise<{lastAcSubmission:string, submitTime:string}>{
        let url = `https://www.acmicpc.net/status?from_mine=1&problem_id=${num}&user_id=${this.id}`
        let target = 'table tr'
        let $ = await this.get(url)
        // Find all rows in the table using Cheerio
        const rows = $(target);
        let submitTime = null; 
        let lastAcSubmission = null;
        for (let i = 1; i < rows.length; i++) {
            let row = $(rows[i]).find('th, td')
            let cells = row.map((_, cell) => $(cell).text().trim()).get();
            // Check if the submission status is "맞았습니다!!"
            if (cells[3] === "맞았습니다!!" || cells[3] === "100점") {
                lastAcSubmission = cells[0]; // Store the submission ID
                submitTime = $(row[row.length - 1]).find('a').attr('data-original-title')
                if (submitTime){


                    let iYear=submitTime.indexOf("년")
                    let iMonth=submitTime.indexOf("월")
                    let iDate=submitTime.indexOf("일")

                    let year = submitTime.slice(0,iYear)
                    let month = submitTime.slice(iYear+2,iMonth).padStart(2, '0')
                    let day = submitTime.slice(iMonth+2,iDate).padStart(2, '0')
                    let HMS = submitTime.slice(iDate+2,submitTime.length)

                    submitTime = `${year}-${month}-${day} ${HMS}`
                    // submitTime = submitTime.replace('년 ', '-').replace('월 ', '-').replace('일', '')
                }
                break;
            }
        }
        return {
            lastAcSubmission: lastAcSubmission || "",
            submitTime : submitTime || ""
        }
    }

    async crawlCode(num:string, LastAcSubmission:string):Promise<string>{
        
        let url = `https://www.acmicpc.net/submit/${num}/${LastAcSubmission}`
        let target = "#submit_form > div:nth-child(5) > div > div > div.CodeMirror-scroll > div.CodeMirror-sizer > div > div > div > div.CodeMirror-code > div"
        let $ = await this.get(url)
        let lines = $(target)
        let sourceCode:string[] = []
        lines.each((index, element) => {
            const text = $(element).text();
            sourceCode.push(utils.cleanSourceCode(text))
        });
        return sourceCode.join("\n")
    }
}