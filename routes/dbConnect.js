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

// === DB Select === // 
let getDeviceList = function (callback) {
    deviceRegistry_pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            callback(err, null);
            return;
        }
        connection.query(
            "SELECT item_id, metadata_key, metadata_value FROM specific_metadata",
            function (err, results) {
                if (!err) {
                    let device_list_key;
                    let device_list = new Object();
                    let sensor = [null];
                    let unit = [null];
                    let actuator = [null];
                    let sen_count = 0;
                    let unit_count = 0;
                    let act_count = 0;
                    let i = 0;
                    let count = 0;

                    for (i in results) {
                        if (
                            device_list_key != results[i].item_id &&
                            device_list_key != undefined
                        ) {
                            let arr = new Array();

                            temp = device_list_key;
                            sensor.length = sen_count + 1;
                            unit.length = unit_count + 1;
                            actuator.length = act_count + 1;

                            arr.push(Array.prototype.slice.call(sensor));
                            arr.push(Array.prototype.slice.call(unit));
                            arr.push(Array.prototype.slice.call(actuator));

                            device_list_key = results[i].item_id;
                            device_list[temp] = Array.prototype.slice.call(arr);
                            arr.length = 0;
                            sen_count = 0;
                            unit_count = 0;
                            act_count = 0;
                        }
                        if (device_list_key == undefined) {
                            device_list_key = results[i].item_id;
                        }
                        let type = results[i].metadata_key.split("-");

                        if (type[0] === "sensor") {
                            let index = Number(type[1]);
                            sensor[index] = results[i].metadata_value; //index 1에서부터 sensor name 저장함.
                            sen_count += 1;
                        } else if (type[0] === "sensor_unit") {
                            let index = Number(type[1]);
                            unit[index] = results[i].metadata_value;
                            unit_count += 1;
                        } else if (type[0] === "actuator") {
                            let index = Number(type[1]);
                            actuator[index] = {};
                            actuator[index][results[i].metadata_value] = [];
                            act_count += 1;
                        } else if (type[0] === "actuator_act") {
                            let act_kind = Number(type[1]);
                            for (let j in actuator[act_kind]) {
                                actuator[act_kind][j].push(results[i].metadata_value);
                            }
                        } else {
                            count += 1;
                            //제외한 데이터 확인용
                            //console.log("제외: " + type[0] + "  " + count)
                        }
                    }
                    let arr = new Array();

                    sensor.length = sen_count + 1;
                    unit.length = unit_count + 1;
                    actuator.length = act_count + 1;

                    arr.push(sensor);
                    arr.push(unit);
                    arr.push(actuator);

                    device_list[device_list_key] = Array.prototype.slice.call(arr);

                    callback(null, device_list);

                    connection.release();
                    return;
                } else {
                    console.log(err.stack);
                }
            }
        );
    });
};
let getSensorList = function (callback) {
    deviceRegistry_pool.getConnection(function (err, connection) {
        if (err) {
            console.log(err);
            connection.release();
            callback(err, null);
            return;
        }
        connection.query(
            "SELECT item_id, device_name FROM device_list",
            function (err, results) {
                if (!err) {
                    getDeviceList(function (err, device_list) {
                        if (err) {
                            console.err(err.stack);
                            return;
                        }
                        for (let i in results) {
                            for (let j in device_list) {
                                if (j == results[i].item_id) {
                                    device_list[j][3] = results[i].device_name;
                                }
                            }
                        }

                        for (let i in device_list) {
                            if (!device_list[i][3]) {
                                delete device_list[i];
                            }
                        }

                        callback(null, device_list);
                    });
                }
            }
        );
        connection.release();
        return;
    });
};
let getSensorTable = function (id, callback) {
    deviceRegistry_pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            callback(err, null);
            return;
        }
        connection.query(
            "SELECT item_id, table_name FROM device_list",
            function (err, results) {
                if (!err) {
                    for (let i in results) {
                        if (results[i].item_id == id) {
                            callback(null, results[i].table_name);
                        }
                    }
                }

                connection.release();
            }
        );
    });
};
let getNowData = function (item_id, callback) {
    sensor_model_pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            callback(err, null);
            return;
        }
        getSensorTable(item_id, function (err, table_name) {
            if (!err) {
                let sql = "SELECT * FROM ?? ORDER BY id DESC limit 1";
                connection.query(sql, table_name, function (err, results) {
                    if (!err && results.length == 1) {
                        results = results[0];
                        getDeviceList(function (err, device_list) {
                            if (!err) {
                                for (let j in results) {
                                    for (let m in device_list[item_id][1]) {
                                        if (
                                            j == device_list[item_id][0][m] &&
                                            device_list[item_id][1][m] != null
                                        ) {
                                            results[j] += device_list[item_id][1][m];
                                        }
                                    }
                                }

                                delete results.id;
                                delete results.timestamp;
                                //전달한 데이터 확인용
                                //console.log(results);
                                callback(null, results);
                            }
                        });
                    } else if (err) {
                        console.log(err.stack);
                    } else {
                        console.log("DB에 저장된 데이터 없음.");
                        getDeviceList(function (err, sensor) {
                            if (!err) {
                                let device_list = new Object();
                                for (let i in sensor[item_id][0]) {
                                    if (i != 0) {
                                        device_list[sensor[item_id][0][i]] = null;
                                    }
                                }
                                for (let i in sensor[item_id][2]) {
                                    if (i != 0) {
                                        for (let j in sensor[item_id][2][i]) {
                                            device_list[j] = null;
                                        }
                                    }
                                }
                                //console.log(device_list);
                                callback(null, device_list);
                            }
                        });
                    }
                });
            } else {
                console.err(err.stack);
            }
        });
        connection.release();
    });
};
let getLog = function (item_id, callback) {
    sensor_model_pool.getConnection(function (err, connection) {
        if (err) {
            connection.release();
            callback(err, null);
            return;
        }
        getSensorTable(item_id, function (err, table_name) {
            if (!err) {
                let log = new Object();
                let sql = "SELECT * FROM ?? ORDER BY id DESC limit 50";
                connection.query(sql, table_name, function (err, results) {
                    if (!err) {
                        getDeviceList(function (err, device_list) {
                            if (!err) {
                                for (let i in results) {
                                    log[i] = {};
                                    for (let k in results[i]) {
                                        log[i][k] = results[i][k];
                                        if (results[i][k]) {
                                            for (let j in device_list[item_id][1]) {
                                                if (k == device_list[item_id][0][j]) {
                                                    log[i][k] += device_list[item_id][1][j];
                                                }
                                            }
                                        }
                                    }
                                }
                                for (let i in log) {
                                    for (let j in log[i]) {
                                        if (j == "id") {
                                            delete log[i][j];
                                        }
                                    }
                                }
                                callback(null, log);
                            } else {
                                console.log(err.stack);
                            }
                        });
                    } else {
                        console.err(err.stack);
                    }
                });
                connection.release();
            }
        });
    });
};

//////////////////////////////////////////////////////////////
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
            delete recent_data[0].id;
            deviceRegistry_pool.query('SELECT * FROM DeviceRegistry.specific_metadata WHERE item_id="' + device[0].item_id + '" AND (metadata_key Like"sensor_unit%" OR metadata_key Like "sensor-%");',function(error, unit){
                for(i in unit){
//                    let temp = ;
//                    console.log(unit[i].metadata_key);
//                    unit[i].metadata_key.replace("sensor_unit", "sensor");
                    //metadata_key와 metadata_value비교해서 metadata_value 이름을 보고 만약 humidity면 recent_data[0]의 humidity커럼멍 뒤에 붙임
                }
                console.log("unit", unit);
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

module.exports.sensor_model_pool = sensor_model_pool,
module.exports.deviceRegistry_pool = deviceRegistry_pool;
module.exports.getDeviceList = getDeviceList;
module.exports.getSensorList = getSensorList;
module.exports.getSensorTable = getSensorTable;
module.exports.getNowData = getNowData;
module.exports.getLog = getLog;


///////////////////////////////////////////
module.exports.getDeviceInfo = getDeviceInfo;
module.exports.getLogData = getLogData;
module.exports.getRecentData = getRecentData;