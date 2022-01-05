var mysql = require('mysql')
var connection = mysql.createConnection({
    "host": "203.234.62.115",
    "port": 3306,
    "user": "dsem_iot",
    "password": "dsem_iot",
    "database": "DeviceMeasurement"
});

connection.connect();

	
var sql = 'SELECT * FROM DeviceRegistry.device_list WHERE item_id=?';
device_id = 4
SYSTEM_ID = ""

connection.query(sql,device_id, function(err,rows,fields) {
  if(err){
    console.log(err);
  }else{
    for(var i =0;i<rows.length;i++){
      SYSTEM_ID = rows[i].system_id
      console.log(rows[i].system_id);
    }
    TOPIC = SYSTEM_ID + "/actuator"
    console.log("topic", TOPIC) 
  }
});


connection.end();