const express = require('express');
const router = new express.Router();
const bcrypt = require('bcrypt');
const User_Account = require('./models').User_Account;
const SPIS_Instance = require('./models').SPIS_Instance;

router.get('/login', function(req, res, next) {
		const currentUser = req.session.user; //req.signedCookies.user;
		if(currentUser) {
			return res.redirect('/');
		}
		next();
	},
	function(req, res){
		var instances;

		instances = SPIS_Instance.findAll({ attributes: ['description', 'license_no'], raw: true })
		.then(function (hospArr) {
			instances = hospArr;
			console.log(instances);
			res.render('account/login.html', {
				instances : instances
			});
		});
		// console.log(instances);
	}
);

router.get('/logout', function(req, res) {
	req.session.user = null;
	res.redirect('/login');
});

router.post('/login', function(req, res){
	console.log(req.body);
	var username = req.body.username;
	var password = req.body.password;
	var spis_instance = req.body.spis_instance;
	// var hash = bcrypt.hashSync(password, 10);

	User_Account.findOne({where: {
		id: username, spisInstanceLicenseNo: spis_instance
	}}).then (single_user => {
		if(single_user == null) {
			req.flash('statusMessage', 'Wrong username and/or password.');
			req.flash('username', username);
			return res.redirect('/');
		}
		else {
			if(bcrypt.compareSync(password, single_user.dataValues.password_hash)) {
				// res.cookie('user', single_user.dataValues, {signed: true});
				req.session.user = single_user.dataValues;
				res.redirect('/');
			} else {
				req.flash('statusMessage', "Wrong username and/or password");
				req.flash('username', username);
				return res.redirect('/');
			}
			// password_hash: hash,
			// res.redirect('/');
			//TODO with cookies and stuff
		};
	});
});

module.exports = router;