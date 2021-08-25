// Express 기본 모듈 불러오기
var express = require("express");
var router = express.Router();

// bodyParser 모듈 불러오기
var bodyParser = require("body-parser");

// json타입으로 파싱하게 설정
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended:true}));

// request 모듈 불러오기
var request = require('request');

// 서버 주소
const address = "http://" + require("ip").address() + ":10204";

router.get("", function (req, res) {
    request(address + "/devices", function(error, response, deviceForm){
        if (!error && response.statusCode == 200) {
            console.log("api 호출 성공: ", deviceForm);

            var devicelist = JSON.parse(deviceForm);
            res.render("mainPage", {
                devicelist
            });
        }
                  
        else{
            console.log("api 호출 실패");
            console.log(error.stack);
        }
    });
});

router.get("/mo", function (req, res) {
    deviceId = req.query.id || req.body.id;
    request(address + "/recent-data/device/" + deviceId, function(error, response, sensorForm){
        if (!error && response.statusCode == 200) {
            console.log("api 호출 성공: ", sensorForm);
            var sensorData = JSON.parse(sensorForm);
            
            res.render("monitoringUiMobile", {
                sensorData
            });
        }
                  
        else{
            console.log("api 호출 실패");
            console.log(error.stack);
        }
    });
});

router.get("/pc", function (req, res) {
    
    deviceId = req.query.id || req.body.id;
    request(address + "/recent-data/device/" + deviceId, function(error, response, sensorForm){
        
        if (!error && response.statusCode == 200) {
            console.log("api 호출 성공: ", sensorForm);
            var sensorData = JSON.parse(sensorForm);
            
            res.render("monitoringUiPC", {
                sensorData
            });
        }
                  
        else{
            console.log("api 호출 실패");
            console.log(error.stack);
        }
    });
});

router.post("/actuator_control", (req, res)=>{
    device_id = req.body.deviceId;
    actuatorName = req.body.actuator;
    actuatorstatus = req.body.status;
    
    request.post(address + "/actuator-control/" + device_id + "/actuator/" + actuatorName + "/status/" + actuatorstatus, function(error, response, results){
        if(!error&&response.statusCode==200){
            console.log("post 전송 성공");
            return res.send(200);
        }
        else{
            console.log("API에러: ", response.statusCode);
            return;
        }
    });
});

router.get("/log", function (req, res) {
    deviceId = req.query.id || req.body.id;
    request(address + "/log/device/" + deviceId, function(error, response, logForm){
        if (!error && response.statusCode == 200) {
            console.log("api 호출 성공: ", logForm);

            var logData = JSON.parse(logForm);
            res.render("log", {
                logData
            });
        }
        else{
            console.log("api 호출 실패");
            console.log(error.stack);
        }
    });
});
module.exports = router;