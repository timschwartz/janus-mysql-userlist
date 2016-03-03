/*
 * This plugin will update the `roomId` and `updated_at` of online users.
 * 
 */

var create_users_query = "CREATE TABLE IF NOT EXISTS `users` (";
    create_users_query+= "`id` int(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(`id`),";
    create_users_query+= "  `userId` varchar(255) NOT NULL, UNIQUE(`userId`),";
    create_users_query+= "  `password` varchar(255) DEFAULT NULL,";
    create_users_query+= "  `ip` varchar(40) NOT NULL,";
    create_users_query+= "  `blocked` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',";
    create_users_query+= "  `note` blob NOT NULL,";
    create_users_query+= "  `client_version` varchar(32) NOT NULL,";
    create_users_query+= "  `roomId` varchar(64) NOT NULL,";
    create_users_query+= "  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',";
    create_users_query+= "  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'";
    create_users_query+= ")";

var mysql  = require('mysql');
var args   = require('optimist').argv;
var config = require(args.config || '../../config.js');

function Plugin(server) {
    if(config.Userlist) {
        console.log("Loading janus-mysql-userlist");
        log.info("Loading janus-mysql-userlist");
        this._conn = mysql.createPool({
            connectionLimit : 30,
            host     : config.MySQL_Hostname,
            user     : config.MySQL_Username,
            password : config.MySQL_Password,
            database : config.MySQL_Database
        });

        this._server = server;

        this._conn.query(create_users_query, function(err, results) {
            if(err != null) throw new Error(err);
            if(results.warningCount == 0) log.info("Created `users` table.");
        });

        console.log("Connected to mysql server "+config.MySQL_Hostname);
        log.info("Connected to mysql server "+config.MySQL_Hostname);
    }
    else {
        console.log("Plugin janus-mysql-userlist disabled in config file.");
        log.info("Plugin janus-mysql-userlist disabled in config file.");
    }
}

Plugin.prototype.call = function() {
    if(config.Userlist) {
        var users = this._server._userList;
    
        var items = this._server._sessions._items;
  
        var active = Array();
        for(i in items) {
            active.push(items[i].id);
        }

        for(u in users) {
            if(active.indexOf(u) == -1) {
                delete this._server._userList[u];
                continue;
            }

            query = "INSERT INTO `users` (`userId`, `updated_at`, `roomId`) VALUES (?, NOW(), ?) ON DUPLICATE KEY UPDATE `updated_at` = NOW(), `roomId` = ?;";
            inserts = [u, users[u].roomId, users[u].roomId];
            sql = mysql.format(query, inserts);

            this._conn.query(sql, function(err, results) {
                if(err != null) console.log(err);
            });
        }
    }
}

module.exports = Plugin;
