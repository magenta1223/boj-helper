# boj-helper README

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

5. Run test cases.
    - `Ctrl+Shift+P` -> `BOJ Helper: Run Testcase` -> 문제 번호 입력
    - 문제파일이 있어야 수행 가능함. 
    - 문제 폴더 내의 testCases.txt를 참조해 수행하고, 최대 150,000ms 내에 수행 가능한지 확인 (문제의 timeout을 참조하도록 업데이트 예정)


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
 



## Guidelines

### Initialize 

1. Install Google Chrome (or Update Google Chrome). Add the path of 
2. Update vscode(>=1.9.0)
3. Generate New Github Repository
4. Press `Ctrl+","` and search `boj-helper` 
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
8. `Ctrl+","`, search `markdown.math`, and check (enabling rendering of equations using Katex)

### Solve Problems 
1. `Ctrl+Shift+P` -> `BOJ Helper: Create Problem`
2. Solve Problems.
3. `Ctrl+Shift+P` -> `BOJ Helper: push to github repository`



## Release Notes


## 0.1.12
- table이 포함된 문제에서 제대로 렌더링되지 않던 문제 수정

## 0.1.11
- updator 추가 -> version 변화를 감지, 기존에 생성된 문제도 재구성함. 
- 0.1.10에서 문제 보기를 webview에서 md로 변경함에 따라 이미지를 md파일에 포함.
- 표 caption 가운데 맞춤 

## 0.1.10
- inline 수식이 있는 문제(mjxcontainer를 사용한 문제)를 열 때, webview에서 수식을 렌더링하지 못하는 이슈 발견 
    - webview대신 markdown으로 열기
    

## 0.1.9
- 문제 생성 시 자동으로 해당 폴더로 이동 
- README 갱신 시 최상단으로 이동해 푼 문제를 problems로 옮길 때 빈 폴더만 남는 현상 제거 


### 0.1.8
- 알림 방식 변경 (information message -> progress)
- 알림 횟수 감소

### 0.1.6
- 테스트케이스 실행 기능이 추가되었습니다.
    - `Ctrl+Shift+P` -> `BOJ Helper: Run Testcase` -> 문제 번호 입력
    - 문제파일이 있어야 수행 가능함. 
    - 문제 폴더 내의 testCases.txt를 참조해 수행하고, 최대 150,000ms 내에 수행 가능한지 확인 (문제의 timeout을 참조하도록 업데이트 예정)
- 커스텀 테스트 케이스 작성이 추가되었습니다.
    - 문제 생성 후 문제 폴더 내의 testCases.txt를 편집
    - 양식은 다음과 같습니다
        ```
        Input:(
        입력값
        )

        Output:(
        출력값
        )

        ```

### 0.1.5
- 이미지가 정상적으로 로드되지 않던 문제가 해결되었습니다.
- Baekjoon Online Judge ID가 정상적으로 problems.md 파일에 정상적으로 입력되지 않던 문제가 해결되었습니다. 
- metadata.json의 가독성이 개선되었습니다. 

### 0.1.4
- 푼 문제 리스트를 가져오는 과정이 개선되었습니다.
- 서브태스크가 존재하는 문제의 소스코드를 가져오는 과정이 개선되었습니다. 
- test.svg 가 profile.svg로 변경되었습니다. 


### 0.1.0 
- add
    - BOJ Helper: Open Problem
    - BOJ Helper: Create Problem
    - BOJ Helper: Crawl Solved Problems
    - BOJ Helper: Update README.md
    - BOJ Helper: push to github repository