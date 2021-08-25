# dsem_iot_monitor

[Window] 서버 실행방법
===========
### 1. node.js 설치   
https://nodejs.org/ko/ (LTS버전 권장)

### 2. cmd 실행   
[Windows 키 + R]로 실행창 띄우고 "cmd" 입력 후 실행

### 3. cmd로 폴더 경로 지정   
cmd에서 cd(Change Directory)명령어로 클론폴더 경로 지정

### 4. "npm install"로 모듈 자동설치하기   
클론폴더 현재 경로에서 "npm install"을 입력하여 현재 저장되어 있는 모듈 자동 설치

### 5. "node server.js"로 서버 실행하기   
모듈설치를 전부 완료하면 클론폴더 현재 경로에서 "node server.js"로 서버 실행

### 5-1. Background에서 Server 구동   
현재 경로에서 "npm install forever -g" 서버로 forever 모듈 설치   
#### 5-1-1 forever 모듈로 Background Server 실행   
##### "forever start server.js"   
#### 5-1-2 forever 모듈로 실행한 Background Server 종료   
##### "forever stop server.js"   
#### 5-1-3 forever로 실행한 서버 목록 및 로그   
##### "forever list"   

### 6. "http://localhost:10204"로 웹페이지 접속(해당 컴퓨터 IP)   
"[현재 컴퓨터 IP] : [현재 현재 할당된 포트번호]" 으로 메인 웹페이지 접속



[Window]서버 관리
===========================
### 1. Visual Studio Code 나 Brackets 설치 및 실행   
Visual Studio Code: https://code.visualstudio.com/download   
Brackets: http://brackets.io/   

### 2. 클론폴더 경로로 폴더 열기   

### 3. server.js 파일 안에서 서버 관리   
app.set('port', process.env.PORT || 10203); --> 여기서 포트 번호 변경 가능      
#### 3-1 예시) 포트번호를 14000으로 바꾸고 싶을때   
ex) app.set('port', process.env.PORT || 14000);   

### 4. Main페이지, Monitoring페이지, Log페이지 관리   
#### views폴더 안에 있음   
##### 4-1 Main 페이지
###### mainPage.ejs   
##### 4-2 Monitoring페이지   
###### PC버전: monitoringUiMobile.ejs   
###### Mobile버전: monitoringUiPC.ejs   
##### 4-3 Log페이지
###### log.ejs   

