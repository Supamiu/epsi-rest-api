var sha256 = require('sha256');
var express = require('express');
var router = express.Router();

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'api',
    password: 'password',
    database: 'tweeter_api'
});

connection.connect();
/*
 Login simple avec la BDD.
 */
router.get('/login', function (req, res) {
    var login = req.query.login;
    var password = sha256(req.query.password);
    connection.query('SELECT * FROM user WHERE login = ? AND password = ?', [login, password], function (err, rows, fields) {
        if (err || rows.length === 0) {
            res.status(400).send();
        } else {
            res.send({key: new Buffer(rows[0].id + ":" + login + ":" + password).toString('base64')});
        }
    });
});

/*
 Création d'un utilisateur via méthode POST.
 */
router.post('/users', function (req, res) {
    if (!req.body.login || !req.body.password) {
        res.status(400).send();
    } else {
        var login = req.body.login;
        var password = sha256(req.body.password);

        connection.query('INSERT INTO user SET ?', {login: login, password: password}, function (err, result) {
            if (err) throw err;
            res.status(201).send({key: new Buffer(result.insertId + ":" + login + ":" + password).toString('base64')});
        });
    }

});

module.exports = router;