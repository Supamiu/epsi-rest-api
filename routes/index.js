var express = require('express');
var router = express.Router();

var sha256 = require('sha256');

var auth = require('../auth/auth');

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'api',
    password: 'password',
    database: 'tweeter_api'
});

/*
 FAVORIS
 */
router.get('/users/:id/saved', function (req, res) {
    var user = res.user;
    if (user.id !== +req.param('id')) {
        res.status(403).send();
    } else {
        connection.connect();
        connection.query("SELECT * FROM user JOIN saved_tweets ON user.id = saved_tweets.user_id WHERE user.id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                var data = [];
                for (var row in rows) {
                    data.append({id: row.id, tweeter_id: row.tweeter_id})
                }
                res.send(data);
            }
        });
        connection.end();
    }
});

router.post('/users/:id/saved', function (req, res, next) {
    var user = res.user;
    if (user.id !== +req.param('id')) {
        res.status(403).send();
    } else {
        connection.connect();
        connection.query("INSERT INTO saved_tweets SET ?", {user_id: res.user.id, tweeter_id: req.body.tweeter_id}, function (err, rows) {
            if (err) {
                throw err;
            } else {
                res.status(201).send();
            }
        });
        connection.end();
    }
});

module.exports = router;
