var express = require("express");
var mysql   = require("mysql");
var mongoose = require("mongoose");
var bodyParser  = require("body-parser");
var rest = require("./routes.js");
var colors = require("colors");
var app  = express();

var mysql_db = 'aspace';

function REST(){
    var self = this;
    self.connectMysql();
    self.connectNoSQL();
};

REST.prototype.connectNoSQL = function (){
  mongoose.Promise = global.Promise;
  mongoose.createConnection('mongodb:/localhost/aspaceDB/', { useMongoClient: true });
  console.log("MongoDB is connected!".random);
}
REST.prototype.connectMysql = function() {
    var self = this;
    var server = '138.68.241.101';
    var local = 'localhost';
    var pool      =    mysql.createPool({
        host     : local,
        port     : 3306,
        user     : 'avi',
        password : 'aspace-avi13579',
        database :  mysql_db,
        timeout  : 5000,
        multipleStatements: true,
        debug    :  false
    });
    pool.getConnection(function(err,connection){
        if(err) {
          self.stop(err);
        } else {
          console.log(`MySQL is connected!`.random);
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
          console.log("ASPACE-API is live.");
      });
}

REST.prototype.stop = function(err) {
    console.log(err);
    process.exit(1);
}

new REST();
