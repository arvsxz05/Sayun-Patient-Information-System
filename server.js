//Module Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const consolidate = require('consolidate');
const User_Account = require('./models').User_Account;
// const Hospital = require('./database').Hospital;

//Database Set-up

//end of Module Dependencies

//Server Set-up
const port = 8000;
const app = express();

app.listen(port, function(){
	console.log('SPIS: Server Running!');
});

app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.engine('html', consolidate.nunjucks);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

///////////// ROUTES ///////////////////

app.get('/', function(req, res){
	res.render('account/home.html');
	// User_Account.findAll().then(function(results) {
	// 	console.log(results);
	// });
});

app.get('/login', function(req, res){
	res.render('account/login.html');
});

app.get('/add_account', function(req, res){
	res.render('account/add-account.html');
});

app.post('/add_account', function(req, res){
	// console.log(req.body);
	// res.redirect('/add_account');
	var username = req.body.username;
	var lastname = req.body.last_name;
	var firstname = req.body.first_name;
	var middlename = req.body.middle_name;
	var suffix = req.body.suffix;
	var contact_num = req.body.contact_num;
	var email_add = req.body.email_add;
	var license_num = req.body.license_num;
	var ptr_num = req.body.ptr_num;
	var s2_license_num = req.body.s2_license_num;
	var password = req.body.password;
});

app.post('/login', function(req, res){
	console.log(req.body);
	var username = req.body.username;
	var password = req.body.password;
	res.redirect("/login");

});

