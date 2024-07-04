# Change Log

## [0.1.6]
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

## [0.1.5]
- 이미지가 정상적으로 로드되지 않던 문제가 해결되었습니다.
- Baekjoon Online Judge ID가 정상적으로 problems.md 파일에 정상적으로 입력되지 않던 문제가 해결되었습니다. 
- metadata.json의 가독성이 개선되었습니다. 

## [0.1.4]
- 푼 문제 리스트를 가져오는 과정이 개선되었습니다.
- 서브태스크가 존재하는 문제의 소스코드를 가져오는 과정이 개선되었습니다. 
- test.svg 가 profile.svg로 변경되었습니다. 


## [0.1.3]
- Initial release
