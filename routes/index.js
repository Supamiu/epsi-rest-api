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

var twitterAPI = require('node-twitter-api');

var twitter = new twitterAPI({
    consumerKey: 'Bir1fGy9ehDx0XWgU6jnBbb4M',
    consumerSecret: 'm9StQLJSZr2aRNbjJmJMQRgQ6kUhfu57eskWfMdfrvXkKZvx2i',
    callback: 'http://127.0.0.1/todo'
});

router.get('/users/:id/friends', function (req, res) {
    var user = res.user;
    console.log(+req.params['id']);
    console.log(user.id);
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.connect();
        connection.query("SELECT * FROM user WHERE id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                twitter.getRequestToken(function (error) {
                    if (error) {
                        console.log("Error getting OAuth request token : ", error);
                    } else {
                        twitter.friends("ids", {}, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                            res.send(data);
                        });
                    }
                });
            }
        });
        connection.end();
    }
});

router.get('/users/:id/friends/:friend_id/tweets', function (req, res) {
    var user = res.user;
    console.log(+req.params['id']);
    console.log(user.id);
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.connect();
        connection.query("SELECT * FROM user WHERE id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                twitter.getRequestToken(function (error) {
                    if (error) {
                        console.log("Error getting OAuth request token : ", error);
                    } else {
                        twitter.getTimeline("user", {user_id:req.params['friend_id']}, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                            res.send(data);
                        });
                    }
                });
            }
        });
        connection.end();
    }
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

router.post('/users/:id/saved', function (req, res) {
    var user = res.user;
    if (user.id !== +req.param('id')) {
        res.status(403).send();
    } else {
        connection.connect();
        connection.query("INSERT INTO saved_tweets SET ?", {
            user_id: res.user.id,
            tweeter_id: req.body.tweeter_id
        }, function (err, rows) {
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
