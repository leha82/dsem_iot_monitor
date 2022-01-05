// Express 기본 모듈 불러오기
var express = require("express"),
  http = require("http"),
  path = require("path");

// Express의 미들웨어 불러오기
var bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  static = require("serve-static"),
  errorHandler = require("errorhandler");

// 에러 핸들러 모듈 사용
var expressErrorHandler = require("express-error-handler");

// Session 미들웨어 불러오기
var expressSession = require("express-session");

// 익스프레스 객체 생성
var app = express();

let fs = require("fs");
let DB_info = JSON.parse(fs.readFileSync("DB_info.json").toString());
let mysql = require("mysql");
let device_list = new Object();

//===== 뷰 엔진 설정 =====//
//app.set('views', __dirname + '/views');
app.set("view engine", "ejs");
console.log("뷰 엔진이 ejs로 설정되었습니다.");
app.use(express.static(path.join(__dirname, "public")));

//===== 서버 변수 설정 및 static으로 public 폴더 설정  =====//
app.set("port", process.env.PORT || 10203);

// public 폴더를 static으로 오픈
app.use("/public", static(path.join(__dirname, "public")));

// json타입으로 파싱하게 설정
app.use(bodyParser.json());

// ===== 404 에러 페이지 처리 =====//
var errorHandler = expressErrorHandler({
  static: {
    404: "./public/404.html",
  },
});

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

app.use(errorHandler);

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

app.get("", function (req, res) {
  //데이터 받아오기
  getSensorList(function (err, devicelist) {
    if (err) {
      console.log(err.stack);
      return;
    }
    //console.log({devicelist});
    res.render("mainPage", {
      devicelist,
    });
    //console.log(devicelist[5][2])
    //console.log(Object.keys(devicelist[5][2][2]))
    //console.log(Object.values(devicelist[5][2][2]))
  });
});

app.get("/mo", function (req, res) {
  //데이터 받아오기
  getSensorList(function (err, devicelist) {
    if (err) {
      console.log(err.stack);
      return;
    }
//  console.log("DEVICELIST: ",devicelist)
    deviceId = req.query.id || req.body.id;
    deviceRegistry_pool.query("SELECT table_name FROM device_list WHERE item_id = ?", deviceId , function(err, db1_res) {
        var table_name =  db1_res[0]['table_name']
        sensor_model_pool.query("SELECT * FROM " + table_name + " ORDER BY id DESC limit 1", function (er, item, fields) {
            getNowData(deviceId, function (err, results) {
              res.render("monitoringUiMobile", {
                results, devicelist, deviceId, item
              });
            });
        }); 
    });
  })
});

app.get("/pc", function (req, res) {
  //데이터 받아오기
  getSensorList(function (err, devicelist) {
    if (err) {
      console.log(err.stack);
      return;
    }
//  console.log("DEVICELIST: ",devicelist)
    deviceId = req.query.id || req.body.id;
    deviceRegistry_pool.query("SELECT table_name FROM device_list WHERE item_id = ?", deviceId , function(err, db1_res) {
        var table_name =  db1_res[0]['table_name']
        sensor_model_pool.query("SELECT * FROM " + table_name + " ORDER BY id DESC limit 1", function (er, item, fields) {
            getNowData(deviceId, function (err, results) {
              res.render("monitoringUiPC", {
                results, devicelist, deviceId, item
              });
            });
        }); 
    });
  });
});


app.get("/log", function (req, res) {
  //데이터 받아오기
  getSensorList(function (err, devicelist) {
    if (err) {
      console.log(err.stack);
      return;
    }

    deviceId = req.query.id || req.body.id;
    getLog(deviceId, function (err, results) {
      res.render("log", {
        results,
        devicelist,
        deviceId,
      });
    });
  });
});

app.get("/on", function(req, res) {
    
    actuator = req.query.actuator
    device_id = req.query.deviceId
    
    
    deviceRegistry_pool.query('SELECT item_id, table_name FROM device_list', function(err, results, fields){
        
        results = results.reduce((result, item, index, array) => {
            result[item.item_id] = item.table_name
            return result
        }, {})
        
        console.log('inside dict - res : ', results[device_id])
        sensor_model_pool.query('INSERT INTO '+results[device_id]+'_act (actuator, status, timestamp) VALUES(?, 1, NOW())', actuator);

        res.send(200)
    })
    
})

app.get("/off", function(req, res) {
    actuator = req.query.actuator
    device_id = req.query.deviceId
    
    
    deviceRegistry_pool.query('SELECT item_id, table_name FROM device_list', function(err, results, fields){
        
        results = results.reduce((result, item, index, array) => {
            result[item.item_id] = item.table_name
            return result
        }, {})
        
        console.log('inside dict - res : ', results[device_id])
        sensor_model_pool.query('INSERT INTO '+results[device_id]+'_act (actuator, status, timestamp) VALUES(?, 0, NOW())', actuator);
        res.send(200)
    })
})

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
