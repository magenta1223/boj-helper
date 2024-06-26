# boj-helper
- This is source code of Visual Studio Code Extension [boj-helper](https://marketplace.visualstudio.com/items?itemName=magenta1223.boj-helper) by magenta1223 .
- example is [here](https://github.com/magenta1223/boj-ttest)

## Features

1. open Problem: Given problem number, open the problem in the vscode window.
2. Create Problem: Given problem number, open the problem in the vscode window and create problem template. 
3. Crawl solved problems: Crawl all the solved problems' source code. 
3. Update Readme.md: Update README.md
    - user information from https://solved.ac
    - problems lists sorted by date and level.  
    - streak 
    - statistics
4. push to github

## Requirements
- vscode >= 1.9.0
- languages: python, cpp, c, rust
- Google Chrome Browser for crawling 

## Extension Settings
- boj-helper.BOJID: Baekjoon Online Judge ID. 
- boj-helper.language: default programming language 
- boj-helper.gitUsername: github username 
- boj-helper.gitEmail: github email
- boj-helper.gitAddress: github address.
- boj-helper.chromePath: path of chrome.exe. default: C:/Program Files/Google/Chrome/Application/chrome.exe"
 

## Release Notes

### 0.1.0 
- add
    - BOJ Helper: Open Problem
    - BOJ Helper: Create Problem
    - BOJ Helper: Crawl Solved Problems
    - BOJ Helper: Update README.md
    - BOJ Helper: push to github repository


## Guidelines

### Initialize 

1. Install Google Chrome (or Update Google Chrome). Add the path of 
2. Update vscode(>=1.9.0)
3. Generate New Github Repository
4. Press `Ctrl+,` and search `boj-helper` 
    - Add your Baekjoon Online Judge ID to `boj-helper.BOJID`
    - Select the programming language for solving the problems to `boj-helper.language`. Valid options are `python`, `cpp`, `c`, `java`, and `rust`.
    - add your git username to `boj-helper.gitUsername`
    - add your git email to `boj-helper.gitEmail`
    - add your github repository to `boj-helper.gitAddress` (e.g. https://github.com/%username%/%repository%.git).
    - add the path of `chrome.exe` to `boj-helper.chromePath` 


5. `Ctrl+Shift+P` -> `BOJ Helper: Crawl Solved Problems`
    - This commands requires Baekjoon online Judge passwords for crawling your source codes of problems you solved before. 

6. `Ctrl+Shift+P` -> `BOJ Helper: Update README.md`
7. `Ctrl+Shift+P` -> `BOJ Helper: push to github repository`


### Solve Problems 
1. `Ctrl+Shift+P` -> `BOJ Helper: Create Problem`
2. Solve Problems.
3. `Ctrl+Shift+P` -> `BOJ Helper: push to github repository`
