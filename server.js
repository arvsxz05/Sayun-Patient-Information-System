//Module Dependencies
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var consolidate = require('consolidate');

//Database Set-up
var options = {promiseLib: Promise};  
var pgp = require('pg-promise')(options);
var connectionString =  'postgres://admin:admin@127.0.0.1:5432/spis';
var db = pgp(connectionString);
//

//Passport Set-up; for User Authentication
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
//

//end of Module Dependencies

//Server Set-up
var port = 8000;
var app = express();

var server = http.createServer(app);
var io = require('socket.io')(server);
server.listen(port, function(){
	console.log('SPIS: Server Running!');
});

//////////MIDDLEWARE/////////////

// Passport middleware

passport.use(new Strategy(
	function(username, password, cb){
		db.users.findByUsername(username, function(err, user){
			if(err){
				return cb(err);
			}
			if(!user){
				return cb(null, false);
			}
			if(user.password != password){
				return cb(null, false);
			}
			return cb(null, user);
		});
	}));

app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.engine('html', consolidate.nunjucks);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

///////////// ROUTES ///////////////////

app.get('/', function(req, res){
	res.redirect("/login");
});

app.get('/login', function(req, res){
	db.any("select last_name from Patient where last_name = $1", ['Erasmo'])
		.then(function(data){
			console.log(data);
		})
		.catch(function(error){
			console.log(error);
		});
	res.render('account/login.html');
});

app.post('/login', function(req, res){
	console.log(req.body);
	var username = req.body.user_name;
	var password = req.body.password;
	res.redirect("/login");

	// res.sendFile(__dirname+"/views"+"/accounts/login.html")
})

