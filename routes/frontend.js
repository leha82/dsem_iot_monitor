// Express 기본 모듈 불러오기
var express = require("express");
var router = express.Router();

// bodyParser 모듈 불러오기
var bodyParser = require("body-parser");

// json타입으로 파싱하게 설정
router.use(bodyParser.json());

// request 모듈 불러오기
var request = require('request');

const dbConnect = require("./dbConnect.js");

router.get("", function (req, res) {
    request(" http://203.234.62.144:10203/devices", function(error, response, deviceForm){
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
    request(" http://203.234.62.144:10203/recent-data/device/" + deviceId, function(error, response, sensorForm){
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
    request(" http://203.234.62.144:10203/recent-data/device/" + deviceId, function(error, response, sensorForm){
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

router.get("/log", function (req, res) {
    deviceId = req.query.id || req.body.id;
    request(" http://203.234.62.144:10203/log/device/" + deviceId, function(error, response, logForm){
        if (!error && response.statusCode == 200) {
//            console.log("api 호출 성공: ", logForm);

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

router.get("/on", function (req, res) {

    actuator = req.query.actuator
    device_id = req.query.deviceId


    dbConnect.deviceRegistry_pool.query('SELECT item_id, table_name FROM device_list', function (err, results, fields) {

        results = results.reduce((result, item, index, array) => {
            result[item.item_id] = item.table_name
            return result
        }, {})

        console.log('inside dict - res : ', results[device_id])
        dbConnect.sensor_model_pool.query('INSERT INTO ' + results[device_id] + '_act (actuator, status, timestamp) VALUES(?, 1, NOW())', actuator);

        res.send(200)
    })

})

router.get("/off", function (req, res) {
    actuator = req.query.actuator
    device_id = req.query.deviceId


    dbConnect.deviceRegistry_pool.query('SELECT item_id, table_name FROM device_list', function (err, results, fields) {

        results = results.reduce((result, item, index, array) => {
            result[item.item_id] = item.table_name
            return result
        }, {})

        console.log('inside dict - res : ', results[device_id])
        dbConnect.sensor_model_pool.query('INSERT INTO ' + results[device_id] + '_act (actuator, status, timestamp) VALUES(?, 0, NOW())', actuator);
        res.send(200)
    })
})

module.exports = router;