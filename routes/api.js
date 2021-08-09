// Express 기본 모듈 불러오기
var express = require("express");
var router = express.Router();

// bodyParser 모듈 불러오기
var bodyParser = require("body-parser");

// json타입으로 파싱하게 설정
router.use(bodyParser.json());

const dbConnect = require("./dbConnect");

router.get('/devices', function (req, res) {
    dbConnect.getDeviceInfo(function (err, devicelist) {
        if (err) {
            console.log(err.stack);
            return;
        }
        res.end(devicelist);
    });
});

router.get('/dsemdr-device-sesnsors-monitor/:id', function (req, res) {
    dbConnect.getSensorList(function (err, devicelist) {
        if (err) {
            console.log(err.stack);
            return;
        }
        var device_name = devicelist[req.params.id][3];
        var device_Id = req.params.id;
        
        dbConnect.deviceRegistry_pool.query("SELECT table_name FROM device_list WHERE item_id = ?", device_Id, function (err, db1_res) {
            
            var table_name = db1_res[0]['table_name'];
            dbConnect.sensor_model_pool.query("SELECT * FROM " + table_name + " ORDER BY id DESC limit 1", function (er, item) {
                var timestamp = item[0].timestamp;
                dbConnect.getNowData(device_Id, function (err, results) {
                    console.log("디바이스s 이름: ", device_name);
                    console.log("아이템 아이디: ", device_Id);
                    console.log("results: ", results);
                    console.log("time: ", timestamp);

                    var sensor_form = {
                        "id" : device_Id,
                        "name" : device_name,
                        "time" : timestamp,
                        "data" : results
                    }

                    res.end(JSON.stringify(sensor_form));
                });
            });
        });
    });
});

router.get('/log/device/:id', function (req, res) {
    var device_Id = req.params.id;
    dbConnect.getLogData(device_Id, function(err, logForm){
        console.log("logForm: ", logForm);
        res.end(logForm);
    });
});

router.get('/recent-data/device/:id', function (req, res) {
    var device_Id = req.params.id;
    dbConnect.getRecentData(device_Id, function(err, sensorData){
        if(err){
            console.log("에러: ", err.stack);
            return;
        }
        console.log("sensorData: ", sensorData)
        res.end(sensorData);
    });
});

router.post('/actuator/:id/actuator/:actuator/status/:status', function(req, res){
    var id = req.params.id;
    var actuator = req.params.actuator;
    var status = req.params.status;
    dbConnect.getActuator(id, actuator, status, function(err, results){
        if(err){
            console.log("에러: ", err.stack);
            return;
        }
        res.send(200);
        return;
        
    });
});

module.exports = router;