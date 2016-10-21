var mysql = require('mysql');


function auth(key, callback) {
    var userInformations = new Buffer(key, 'base64').toString("ascii");
    var loginInfos = userInformations.split(":");

    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'api',
        password: 'password',
        database: 'tweeter_api'
    });

    connection.connect();

    connection.query("SELECT * FROM user WHERE id = ?", loginInfos[0], function (err, result) {
        if (err || result === undefined) {
            throw new Error("Invalid login");
        } else {
            callback({
                id: loginInfos[0],
                login: loginInfos[1],
                password: loginInfos[2]
            });
        }
    });

    connection.end();
}

module.exports = auth;