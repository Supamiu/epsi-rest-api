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
    callback: 'http://127.0.0.1:3000/home'
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

router.post('/users/:id/oauth', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query('SELECT * FROM oauth_request WHERE user_id = ?', user.id, function (err, rows) {
            if (err) {
                throw err;
            }
            else {
                if (rows.length === 0) {
                    res.status(400).send();
                } else {
                    console.log(rows[0].request_token, rows[0].request_secret, req.body.oauth_verifier);
                    twitter.getAccessToken(rows[0].request_token, rows[0].request_secret, req.body.oauth_verifier, function (error, accessToken, accessTokenSecret) {
                        if (error) {
                            console.error(error);
                            throw error;
                        }
                        var newUser = {
                            login: user.login,
                            password: user.password,
                            oauth: accessToken,
                            oauth_secret: accessTokenSecret
                        };
                        connection.query("UPDATE user SET ? WHERE id = ?", [newUser, user.id], function (err, rows) {
                            if (err) {
                                throw err;
                            } else {
                                connection.query("DELETE from oauth_request WHERE user_id = ?", user.id, function (err, result) {
                                    user.oauth = accessToken;
                                    user.oauth_secret = accessTokenSecret;
                                    res.send(user);
                                });
                            }
                        });
                    });
                }
            }
        });
    }
});

router.get('/users/:id/oauth', function (req, res) {
    var user = res.user;
    if (user.id != +req.params['id']) {
        res.status(403).send();
    } else {
        twitter.getRequestToken(function (error, requestToken, requestTokenSecret, results) {
            if (error) {
                console.log("Error getting OAuth request token : " + error);
            } else {
                connection.query("INSERT INTO oauth_request SET ?", {
                    user_id: user.id,
                    request_token: requestToken,
                    request_secret: requestTokenSecret
                }, function () {
                    res.send({link: twitter.getAuthUrl(requestToken, {})});
                });
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
                            if(data !== undefined) {
                                data.forEach(function (tweet) {
                                    var tweet_date = new Date(tweet.created_at);
                                    var timeDiff = Math.abs(Date.now() - tweet_date.getTime());
                                    var diffHours = Math.ceil(timeDiff / (1000 * 3600));
                                    if (diffHours < 24) {
                                        result.push(tweet);
                                    }
                                });
                            }
                            res.send(result);
                        });
                    }
                });
            }
        });
    }
});

router.get('/users/:id/friends/lookup', function (req, res) {
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
                        var result_data = [];
                        var array = req.query.ids.split(',');
                        var i, j, temparray, chunk = 99;
                        var requests = array.length / chunk;
                        var done = 0;
                        for (i = 0, j = array.length; i < j; i += chunk) {
                            temparray = array.slice(i, i + chunk);
                            twitter.users("lookup", {user_id: temparray.join(',')}, rows[0].oauth, rows[0].oauth_secret, function (error, data) {
                                result_data = result_data.concat(data);
                                done++;
                                if (done >= requests) {
                                    res.send(result_data);
                                }
                            });
                        }
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
});

router.post('/users/:id/saved', function (req, res) {
    var user = res.user;
    if (user.id !== +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query("INSERT INTO saved_tweets SET ?", {
            user_id: res.user.id,
            tweeter_id: req.body.tweeter_id
        }, function (err) {
            if (err) {
                res.status(400).send({error: err.message})
            } else {
                res.status(201).send();
            }
        });
    }
});

router.get('/users/:id/saved/:saved_id', function (req, res) {
    var user = res.user;
    if (user.id !== +req.params['id']) {
        res.status(403).send();
    } else {
        connection.query("SELECT tweeter_id, user.oauth as oauth, user.oauth_secret as oauth_secret" +
            "FROM user JOIN saved_tweets " +
            "ON user.id = saved_tweets.user_id " +
            "WHERE user.id = ? AND saved_tweets.id = ?", [res.user.id, req.params['saved_id']], function (err, rows) {
            if (err) {
                throw err;
            } else {
                twitter.statuses("show", {}, rows[0].oauth, rows[0].oauth_secret, function (err, data) {
                    res.send(data);
                });
            }
        });
    }
});

module.exports = router;
