let fs = require("fs");
let DB_info = JSON.parse(fs.readFileSync("./DB_info.json").toString());
let mysql = require("mysql");

// ===== DB: DeviceMeasurement =====//
let sensor_model_pool = mysql.createPool({
    host: DB_info[0].host,
    port: DB_info[0].port,
    user: DB_info[0].user,
    password: DB_info[0].password,
    database: DB_info[0].database,
    connectionLimit: 10,
    debug: false, //데이터베이스 처리 과정을 로그로 남김
});

// ===== DB: DeviceRegistry =====//
let deviceRegistry_pool = mysql.createPool({
    host: DB_info[1].host,
    port: DB_info[1].port,
    user: DB_info[1].user,
    password: DB_info[1].password,
    database: DB_info[1].database,
    connectionLimit: 10,
    debug: false, //데이터베이스 처리 과정을 로그로 남김
})

let getDeviceInfo = function(callback){
    deviceRegistry_pool.getConnection(function (err, connection) {
        var sql = 'SELECT DeviceRegistry.specific_metadata.metadata_key, DeviceRegistry.specific_metadata.metadata_value, DeviceRegistry.device_list.device_id, DeviceRegistry.device_list.device_name FROM DeviceRegistry.specific_metadata JOIN DeviceRegistry.device_list ON DeviceRegistry.device_list.item_id = DeviceRegistry.specific_metadata.item_id; ';
        connection.query(sql, function(err, results){
            if(err){
                connection.release();
                console.log("에러: ", err.stack);
                return;
            }
            if(!err){
                connection.release();
                var sensorList = [];
                var sensorInfo = {};
                
                for(i in results) {
                    if(results[i].metadata_key.includes('module_name') || results[i].metadata_key.includes('model')){
                        results.splice(i, 1);
                    }
                    if(!results[i].metadata_key.includes('unit')){
                        sensorList.push(results[i]);
                    }
                    sensorInfo[results[i].device_id] = {};
                }
                
                for(i in sensorList){
                    if(Object.keys(sensorInfo).includes(String(sensorList[i].device_id))){
                        var temp = sensorInfo[sensorList[i].device_id]
                        temp.device_name = sensorList[i].device_name;
                        temp[sensorList[i].metadata_key] = sensorList[i].metadata_value;
                        
                    }
                        
                }
                callback(null, JSON.stringify(sensorInfo));
                
                return;
            }
        });
        
    });
}

let getLogData = function(deviceid, callback){
    sensor_model_pool.query('SELECT device_id, device_name, table_name FROM DeviceRegistry.device_list WHERE device_id=' + deviceid + ';', function(err, device) {
        deviceRegistry_pool.query('SELECT * FROM DeviceMeasurement.' + device[0].table_name + ' ORDER BY id DESC limit 100;', function(er, deviceLog){
          
            for(i in deviceLog){
                delete deviceLog[i].id;
            }
            var log_form = {
                "id" : device[0].device_id,
                "name" : device[0].device_name,
                "log" : deviceLog
            }
//            console.log("deviceLog: ", log_form);
            return callback(null, JSON.stringify(log_form));
        });
    });
}

let getRecentData = function(deviceid, callback){
    
    sensor_model_pool.query('SELECT device_id, item_id, device_name, table_name FROM DeviceRegistry.device_list WHERE device_id=' + deviceid + ';', function(err, device) {
        
        deviceRegistry_pool.query('SELECT * FROM DeviceMeasurement.' + device[0].table_name + ' ORDER BY id DESC limit 1;', function(er, recent_data){
            if(recent_data == null || recent_data[0] == undefined){
                var data_form = {
                    "id" : device[0].device_id,
                    "name" : device[0].device_name,
                    "item" : device[0].item_id
                }
                return callback(null, JSON.stringify(data_form));
            }
            delete recent_data[0].id;

            // unit붙이기 위한 쿼리문 - 수정중
            deviceRegistry_pool.query('SELECT * FROM DeviceRegistry.specific_metadata WHERE item_id="' + device[0].item_id + '" AND (metadata_key Like"sensor_unit%" OR metadata_key Like "sensor-%");',function(error, unit){
                // for(i in unit){
//                    let temp = ;
//                    console.log(unit[i].metadata_key);
//                    unit[i].metadata_key.replace("sensor_unit", "sensor");
                    //metadata_key와 metadata_value비교해서 metadata_value 이름을 보고 만약 humidity면 recent_data[0]의 humidity컬럼 뒤에 붙임
                // }
                // console.log("unit", unit);
                var data_form = {
                    "id" : device[0].device_id,
                    "name" : device[0].device_name,
                    "item" : device[0].item_id,
                    "data" : recent_data[0]
                }
                return callback(null, JSON.stringify(data_form));
            });
        });
    });
}

let setActuator = function(id, actuator, status, callback){
    deviceRegistry_pool.query("SELECT table_name FROM DeviceRegistry.device_list WHERE device_id=" + id + ";", function(error, tableName){
        console.log("Table name: ", tableName[0].table_name);
        sensor_model_pool.query("INSERT INTO " + tableName[0].table_name + "_act (actuator, status, timestamp) VALUES(?, " + status + ", NOW())", actuator, function(err, results){
            if(err){
                console.log("error: ", err.stack);
                return;
            }
            console.log("actuator의 결과: ", results);
            return callback(null, results);
        });
    });
}

module.exports.sensor_model_pool = sensor_model_pool,
module.exports.deviceRegistry_pool = deviceRegistry_pool;

module.exports.getDeviceInfo = getDeviceInfo;
module.exports.getLogData = getLogData;
module.exports.getRecentData = getRecentData;
module.exports.setActuator = setActuator;