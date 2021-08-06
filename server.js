// Express 기본 모듈 불러오기
var express = require("express"),
  http = require("http"),
  path = require("path");

// Express의 미들웨어 불러오기
var bodyParser = require("body-parser"),
  static = require("serve-static");

// 에러 핸들러 모듈 사용
var expressErrorHandler = require("express-error-handler");

// 익스프레스 객체 생성
var app = express();

//===== 뷰 엔진 설정 =====//
//app.set('views', __dirname + '/views');
app.set("view engine", "ejs");
console.log("뷰 엔진이 ejs로 설정되었습니다.");
// app.use(express.static(path.join(__dirname, "public")));
// app.use("/public", static(path.join(__dirname, "public")));

//===== 서버 변수 설정 및 static으로 public 폴더 설정  =====//
app.set("port", process.env.PORT || 10203);

// json타입으로 파싱하게 설정
app.use(bodyParser.json());

// ===== 404 에러 페이지 처리 =====//
var errorHandler = expressErrorHandler({
  static: {
    404: "./public/404.html",
  },
});

// public 폴더를 static으로 오픈
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("public", static(path.join(__dirname, "public")));

// app.use -> JSON API와 frontend 찾도록 함
const api = require('./routes/api.js');
const frontend = require('./routes/frontend.js');
app.use('', api);
app.use('', frontend);


//===== 서버 시작 =====//

//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on("uncaughtException", function (err) {
  console.log("uncaughtException 발생함 : " + err);
  console.log("서버 프로세스 종료하지 않고 유지함.");
  console.log(err.stack);
});

// 시작된 서버 객체를 리턴받도록 합니다.
var server = http.createServer(app).listen(app.get("port"), function () {
  console.log("서버가 시작되었습니다. 포트 : " + app.get("port"));
});
