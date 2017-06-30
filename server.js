//Module Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const consolidate = require('consolidate');
const User_Account = require('./models').User_Account;
const Hospital = require('./models').Hospital;
const Doctor = require('./models').Doctor;
const Admin = require('./models').Admin;
const SPIS_Instance = require('./models').SPIS_Instance;
const database = require('./database');


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
app.use(cookieParser('secret-cookie'));

app.use(require('./auth-routes'));

///////////// ROUTES ///////////////////

///// GET /////

app.get('/', function requireLoggedIn(req, res, next) {
		const currentUser = req.signedCookies.user;
		if(!currentUser) {
			return res.redirect('/login');
		}
		console.log(currentUser)
		next();
	},
	function(req, res){
		const currentUser = req.signedCookies.user;
		res.render('account/home.html', {
			user: currentUser
		});
	}
);

app.get('/add_account', function(req, res){
	res.render('account/add-account.html');
});

app.get('/account_view_edit/:username', function(req, res){
	res.render('account/view-edit-account.html');
});

app.get('/account_list', function(req, res){
	var allAccounts = [];

	User_Account.findAll(
		{raw: true}
		).then(function(results){
			for( var i = 0; i < results.length; i++ ){
				var result = results[i];

				allAccounts.push({
					username: result.username,
					last_name: result.last_name,
					middle_name: result.middle_name,
					first_name: result.first_name,
					usertype: result.usertype,
				});
			}
		});


	res.render('account/account-list.html', {
		user_accounts: allAccounts
	});
});

app.get('/hcl_add', function(req, res){
	res.render('account/add-hcl.html');
});

app.get('/hcl_view_edit/:name', function(req, res){
	res.render('account/view-edit-hcl.html');
})

app.get('/hcl_list', function(req, res){
	var allHCL = [];
	Hospital.findAll(
		{	raw: true, 
			where: {active: true}}
		).then(function(results){
			console.log("RAW QUERY");
			console.log(results);
			for( var i = 0; i < results.length; i++ ){
				var result = results[i];
				allHCL.push(
				{
					name: result.name,
					address: result.address,
					type: result.type,
					contact_num: result.contact_numbers,
				}
					);

				console.log("contact number of "+result.name+" : "+result.contact_numbers);
			}

	});

	res.render('account/hcl-list.html', {
		hcls : allHCL
	});
});

///// POST /////

app.post('/add_account', function(req, res){
	// console.log(req.body);
	// res.redirect('/add_account');

	var temp;

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


	// database.transaction(function(t) {
		SPIS_Instance.findOne({ where: {license_no: 1} }).then(function(instance) {
			// console.log('here' + instance.description);
			temp = {
				id : username,
				last_name : lastname,
				first_name : firstname,
				middle_name : middlename,
				suffix : suffix,
				contact_number : contact_num,
				email : email_add,
				password_hash : password,
				spisInstanceLicenseNo : instance.license_no
			}
			// console.log(temp);
			User_Account.create(temp).then(account => {
				if (req.body.user_type == "Doctor") {
					console.log(account);
					Doctor.create({
						license_no : license_num,
						ptr_no : ptr_num,
						s2_license_no : s2_license_num,
						usernameId: account.dataValues.id
					})
					.catch(function(error) {
						console.log(error);
						res.render('account/add-account.html', {
							error: error
						});
					});
				};
				if (req.body.user_type == "Secretary") {
					Secretary.create({
						usernameId: account.dataValues.id
					})
					.catch(function(error) {
						console.log(error);
						res.render('account/add-account.html', {
							error: error
						});
					});
				};
				if(req.body.access_rights == "Admin") {
					Admin.create({
						usernameId: account.dataValues.id
					})
					.catch(function(error) {
						console.log(error);
						res.render('account/add-account.html', {
							error: error
						});
					});
				};
				res.redirect('/');
			})//.then(function () {
			// 	t.commit();
			// })
			.catch(function(error) {
				console.log(error);
				res.render('account/add-account.html', {
					error: error
				});
			});
		// });
	});
});



app.post('/account_delete', function(req, res){
	var results = req.body;

	for(result in results){
		console.log(result);

		User_Account.update({
			active: false,
		}, 
		{
			where: {name: result},
		}).then(function(item){
			console.log("Disabled "+item+" successfully!");
		}).catch(function(error){
			console.log(error.stack);
		});

	}
})

app.post('/hcl_add', function(req, res){

	console.log(req.body)

	// console.log(req.santizeBody('name').escape());

	var name = req.body.name;
	var address = req.body.address;
	var type = req.body.type;
	var cn = req.body.cn;

	var cn_arr = cn.split(",");

	for(var i = 0; i < cn_arr.length; i++){
		cn_arr[i].trim();
	}

	Hospital.create({
		name: name,
		address: address,
		type: type,
		contact_numbers: cn_arr,
	}).then(function(item){
		var message = "Created "+item.type+" successfully!";

		res.render('account/add-hcl.html', {message: message});

	}).catch(function(error){
		console.log(error.stack);

		var message = "Something happened!";

		res.render('account/add-hcl.html', {message: message});
	});
});

app.post('/hcl_disable', function(req, res){
	console.log("in disable: ");
	var results = req.body;

	for(result in results){
		console.log(result);

		Hospital.update({
			active: false,
		}, 
		{
			where: {name: result},
		}).then(function(item){
			console.log("Disabled "+item+" successfully!");
		}).catch(function(error){
			console.log(error.stack);
		});

	}

});
