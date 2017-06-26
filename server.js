var express = require("express");
var mysql   = require("mysql");
var bodyParser  = require("body-parser");
var rest = require("./routes.js");
var app  = express();

var db = 'parcare';

function REST(){
    var self = this;
    self.connectMysql();
};

REST.prototype.connectMysql = function() {
    var self = this;
    var server = '192.241.224.224';
    var local = 'localhost';
    var pool      =    mysql.createPool({
        connectionLimit : 100,
        host     : local,
        user     : 'avi',
        password : 'parcareavi158',
        database :  db,
        timeout  : 1000,
        debug    :  false
    });
    pool.getConnection(function(err,connection){
        if(err) {
          self.stop(err);
        } else {
          console.log(`connected to database: ${db}!`);
          self.configureExpress(connection);
        }
    });
}

REST.prototype.configureExpress = function(connection) {
      var self = this;
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());
      var router = express.Router();
      app.use('/api', router);
      var rest_router = new rest(router,connection);
      self.startServer();
}

REST.prototype.startServer = function() {
      app.listen(3000,function(){
          console.log("PARCARE-API is live.");
      });
}

REST.prototype.stop = function(err) {
    console.log("ERROR: " + err);
    process.exit(1);
}

new REST();
