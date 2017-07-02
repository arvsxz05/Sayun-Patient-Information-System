//Module Dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const consolidate = require('consolidate');
const User_Account = require('./models').User_Account;
const Hospital = require('./models').Hospital;
const Doctor = require('./models').Doctor;
const Secretary = require('./models').Secretary;
const Admin = require('./models').Admin;
const SPIS_Instance = require('./models').SPIS_Instance;
const database = require('./database');
const session = require('express-session');
const flash = require('express-flash');

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
app.use(session({ secret: 'secret-cookie' }));
app.use(flash());

app.use(require('./auth-routes'));

///////////// ROUTES ///////////////////

///// GET /////

function requireLoggedIn(req, res, next) {
	const currentUser = req.session.user; //req.signedCookies.user;
	if(!currentUser) {
		return res.redirect('/login');
	}
	next();
}

function requireSuperUser(req, res, next) {
	const currentUser = req.session.user;
	const superu = req.session.superuser;
	if(!currentUser || !superu) {
		return res.redirect('/login');
	}
	next();
}

function requireSuperAdmin(req, res, next) {
	const admin = req.session.admin;
	const superu = req.session.superuser;
	if(!(admin || superu)) {
		return res.redirect('/login');
	}
	next();
}

app.get('/', requireLoggedIn,
	function(req, res){
		const currentUser = req.session.user; //req.signedCookies.user;
		res.render('account/home.html', {
			user: currentUser,
			doctor: req.session.doctor,
			secretary: req.session.secretary,
			admin : req.session.admin,
			superuser: req.session.superuser
		});
	}
);

app.get('/account_add', requireLoggedIn, requireSuperUser, function(req, res){
	res.render('account/add-account.html');
});

app.get('/hcl_add', requireLoggedIn, requireSuperUser, function(req, res){
	res.render('account/add-hcl.html');
});

app.get('/hcl_edit/:name', requireLoggedIn, requireSuperUser, function(req, res){

	// var name = req.body;
	var key = req.params.name;
	var hospital;

	Hospital.findOne({
		where: {
			name: key,
		},
		raw: true
	}).then(function(result){
		hospital = result;
		// console.log("HERE IN : " + JSON.stringify(hospital));
		res.json(hospital);
	});

});

app.get('/hcl_list', requireLoggedIn, requireSuperAdmin, function(req, res){
	var allHCL = [];
	Hospital.findAll({	
		raw: true,
		order: [
			['createdAt', 'DESC'],
		],
		}).then(function(results){
			// console.log(results);
			for( var i = 0; i < results.length; i++ ){
				var result = results[i];
				allHCL.push(
				{
					name: result.name,
					address: result.address,
					type: result.type,
					contact_num: result.contact_numbers,
					active: result.active,
				}
					);

			}
			res.render('hospital/list-hospital.html', {
				hcls : allHCL,
				admin : req.session.admin,
				superuser : req.session.superuser
			});
	});
});

app.get('/account_list', requireLoggedIn, requireSuperAdmin, function(req, res){
	var allAccounts = [];
	// console.log("HERE" + req.session.spisinstance.li);
	User_Account.findAll(
		{where: {spisInstanceLicenseNo: req.session.spisinstance.license_no}, 
		raw: true}
		).then(function(results){
			for( var i = 0; i < results.length; i++ ){
				var result = results[i];
				console.log("HEREEEEE:" + result);
				allAccounts.push({
					id: result.id,
					last_name: result.last_name,
					middle_name: result.middle_name,
					first_name: result.first_name,
					contact_nums: result.contact_numbers,
					user_type: result.user_type,
					is_admin: result.isAdmin,
				});
			}

			console.log("here");

			res.render('account/list-accounts.html', {
				user_accounts: allAccounts,
				superuser: req.session.superuser
			});
		});

});

app.get('/account_edit/:id', requireLoggedIn, requireSuperAdmin, function(req, res){
	var id = req.params.id;
	var user;
	var type = {};

	Secretary.findOne({
		where: {
			usernameId: id,
		},
		raw: true
	}).then(result => {
		type['Secretary'] = false;
		if( result != null ){
			type['Secretary'] = true;
		}
		else {
			Doctor.findOne({
				where: {
					usernameId: id,
				},
				raw: true
			}).then(result => {
				type['Secretary'] = false;
				if( result != null ){
					type['Doctor'] = result;
				}
			});
		}
		Admin.findOne({
			where: {
				usernameId: id,
			},
			raw: true
		}).then(result => {
			type['Admin'] = false;
			if( result != null ){
				type['Admin'] = true;
			}
			User_Account.findOne({
				where: {
					id: id,
				},
				raw: true
			}).then(function(result){
				user = result;
				console.log("HEREEEEEEEEEEEEEEE");
				console.log(user);
				res.render('account/view-edit-account.html', {user: user, type: type});
			});
		});
	});
});

///// POST /////

app.post('/add_account', requireLoggedIn, requireSuperUser, function(req, res){
	// console.log(req.body);
	// res.redirect('/add_account');

	var username = req.body.username.trim();
	var lastname = req.body.last_name.trim();
	var firstname = req.body.first_name.trim();
	var title = req.body.title.trim();
	var middlename = req.body.middle_name.trim();
	var suffix = req.body.suffix.trim();
	var contact_count = req.body.count.trim();
	var contact_num = [];
	var email_add = req.body.email_add.trim();
	var license_num = req.body.license_num.trim();
	var ptr_num = req.body.ptr_num.trim();
	var s2_license_num = req.body.s2_license_num.trim();
	var password = req.body.password.trim();
	var user_type = req.body.user_type.trim();
	var is_admin = req.body.access_rights.trim();

	if(email_add === "")
		email_add = null;

	if(suffix === "")
		suffix = null;

	if(is_admin === 'Admin') {
		is_admin = true;
	} else {
		is_admin = false;
	}

	for(var i = 1; i <= contact_count; i++){
		if( (req.body['field' + i]).trim() != ''){
			contact_num.push( req.body['field' + i] );
		}	
	}

	// database.transaction(function(t) {
		SPIS_Instance.findOne({ where: {
			license_no: req.session.spisinstance.license_no
		}}).then(instance => {
			var temp = {
				id : username,
				title: title,
				last_name : lastname,
				first_name : firstname,
				middle_name : middlename,
				suffix : suffix,
				contact_numbers : contact_num,
				email : email_add,
				user_type: user_type,
				isAdmin: is_admin,
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
				res.redirect('/account_list');
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



app.post('/account_delete', requireLoggedIn, requireSuperUser, function(req, res){
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
});

/////////////////// HCL ///////////////////

app.post('/hcl_add', requireLoggedIn, requireSuperUser, function(req, res){
	console.log("ADDING HCL");
	console.log(req.body);

	var name = req.body.name.trim();
	var address = req.body.address.trim();
	var type = req.body.type.trim();
	var cn_arr = req.body.cn;

	if( cn_arr != undefined ){
		for(var i = 0; i < cn_arr.length; i++){
			cn_arr[i].trim();
		}
	}

	Hospital.create({
		name: name,
		address: address,
		type: type,
		contact_numbers: cn_arr,
	}).then(function(item){
		res.json({"status": "success"});
	}).catch(function(error){
		res.json({"status" : "error", "name": req.body.name.trim()});
	});
});

app.post('/hcl_edit', requireLoggedIn, requireSuperUser, function(req, res){

	// console.log(req.body)

	var name = req.body.name.trim();
	var address = req.body.address.trim();
	var type = req.body.type.trim();
	var active = req.body.active;
	var cn_arr = req.body.cn;
	var key = req.body.key;

	if( cn_arr != undefined ){
		for(var i = 0; i < cn_arr.length; i++){
			cn_arr[i].trim();
		}
	}

	console.log(cn_arr);

	Hospital.update({
		name: name,
		address: address,
		active: active,
		type: type,
		contact_numbers: cn_arr,
	},
	{
		where: {
			name: key
		}
	}).then(function(item){
		res.json({"status": "success"});
	}).catch(function(error){
		res.json({"status" : "error", "name": req.body.name.trim()});
	});
});


app.post('/account_edit', requireLoggedIn, function(req, res){
	console.log("IN ACCOUNT EDIT");
	console.log(req.body);

	var id = req.body.id.trim();
	var title = req.body.title.trim();
	var lname = req.body.last_name.trim();
	var fname = req.body.first_name.trim();
	var mname = req.body.middle_name.trim();
	var suffix = req.body.suffix.trim();
	var cnum = req.body.contact_num.trim();
	var email = req.body.email_add.trim();
	var lnum = req.body.license_num.trim();
	var pnum = req.body.ptr_num.trim();
	var s2num = req.body.s2_license_num.trim();
	var key = req.body.edit;

	if( lnum != '' && pnum != '' && s2num != '' ){
		Doctor.update({
			license_no: lnum,
			ptr_no: pnum,
			s2_license_no: s2num,
			usernameId: id,
		},{
			where: {
				usernameId: key
			}
		})
		// .then(function(item){
		// 	res.json({"status": "success"});
		// }).catch(function(error){
		// 	res.json({"status" : "error", "name": req.body.id.trim()});
		// });
	}


	User_Account.update({
		id: id,
		title: title,
		last_name: lname,
		first_name: fname,
		middle_name: mname,
		suffix: suffix,
		contact_num: cnum,
		email: email,
	},
	{
		where: {
			id: key
		}
	}).then(function(item){
		// res.json({"status": "success"});
		res.render('/account_list')
	}).catch(function(error){
		res.json({"status" : "error", "name": req.body.id.trim()});
	});
})