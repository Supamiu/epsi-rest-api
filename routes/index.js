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
connection.connect();

var twitterAPI = require('node-twitter-api');

var twitter = new twitterAPI({
    consumerKey: 'Bir1fGy9ehDx0XWgU6jnBbb4M',
    consumerSecret: 'm9StQLJSZr2aRNbjJmJMQRgQ6kUhfu57eskWfMdfrvXkKZvx2i',
    callback: 'http://127.0.0.1/todo'
});

router.get('/users/:id/friends', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query("SELECT * FROM user WHERE id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                twitter.getRequestToken(function (error) {
                    if (error) {
                        throw error;
                    } else {
                        twitter.friends("ids", {}, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                            res.send(data);
                        });
                    }
                });
            }
        });
    }
});

router.get('/users/:id', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query("SELECT * FROM user WHERE id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                user.oauth = rows[0].oauth;
                user.oauth_secret = rows[0].oauth_secret;
                res.send(user);
            }
        });
    }
});

router.put('/users/:id', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        var newUser = {
            login: req.body.login | user.login,
            password: req.body.password | user.password,
            oauth: req.body.oauth | user.oauth,
            oauth_secret: req.bosy.oauth_secret | user.oauth_secret
        };
        connection.query("UPDATE user SET ?", newUser, function (err, rows) {
            if (err) {
                throw err;
            } else {
                user.oauth = rows[0].oauth;
                user.oauth_secret = rows[0].oauth_secret;
                res.send(user);
            }
        });
    }
});

router.get('/users/:id/friends/:friend_id/tweets', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query("SELECT * FROM user WHERE id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                twitter.getRequestToken(function (error) {
                    if (error) {
                        throw error;
                    } else {
                        twitter.getTimeline("user", {
                            user_id: req.params['friend_id'],
                            exclude_replies: true
                        }, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                            var result = [];
                            data.forEach(function (tweet) {
                                var tweet_date = new Date(tweet.created_at);
                                var timeDiff = Math.abs(Date.now() - tweet_date.getTime());
                                var diffHours = Math.ceil(timeDiff / (1000 * 3600));
                                if (diffHours < 24) {
                                    result.push(tweet);
                                }
                            });
                            res.send(result);
                        });
                    }
                });
            }
        });
    }
});

router.get('/users/:id/friends/:friend_id/tweets/:tweet_id/embed', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query("SELECT * FROM user WHERE id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                twitter.getRequestToken(function (error) {
                    if (error) {
                        throw error;
                    } else {
                        twitter.users("show", {user_id: req.params['friend_id']}, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                            var userName = data.screen_name;
                            twitter.statuses("oembed", {
                                url: 'https://publish.twitter.com/'+userName+'/status/'+req.params['tweet_id']
                            }, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                                res.send(data)
                            });
                        });
                    }
                });
            }
        });
    }
});


router.get('/users/:id/friends/:friend_id', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query("SELECT * FROM user WHERE id = ?", res.user.id, function (err, rows) {
            if (err) {
                throw err;
            } else {
                twitter.getRequestToken(function (error) {
                    if (error) {
                        throw error;
                    } else {
                        twitter.users("show", {user_id: req.params['friend_id']}, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                            res.send(data);
                        });
                    }
                });
            }
        });
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
    }
});

router.post('/users/:id/saved', function (req, res) {
    var user = res.user;
    if (user.id !== +req.param('id')) {
        res.status(403).send();
    } else {
        connection.query("INSERT INTO saved_tweets SET ?", {
            user_id: res.user.id,
            tweeter_id: req.body.tweeter_id
        }, function (err) {
            if (err) {
                throw err;
            } else {
                res.status(201).send();
            }
        });
    }
});

module.exports = router;
