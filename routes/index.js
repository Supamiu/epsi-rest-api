var express = require('express');
var router = express.Router();

var mockUser = {
    id:1,
    login:"test",
    password:"test"
};


/*
            LOGIN
 */
router.get('/login', function(req, res) {
    var login = req.query.login;
    var password = req.query.password;
    if(login === mockUser.login && password === mockUser.password){
        res.send(JSON.stringify(mockUser));
    }else{
        res.status(400).send();
    }
});


/*
            USERS
 */
router.get('/users/{id}', function (req, res) {
    if(+req.param('id') === 1){
        res.send(JSON.stringify(mockUser));
    }else{
        res.status(404).send();
    }
});

router.post('/users', function(req, res){
    //TODO creation utilisateur
   res.status(201);
});

/*
            FAVORIS
 */
router.get('/users/{id}/saved', function(req,res,next){
   //TODO récupérer les tweets favoris de notre user.
});

router.get('/users/{id}/saved', function(req,res,next){
    //TODO récupérer les tweets favoris de notre user.
});

module.exports = router;
