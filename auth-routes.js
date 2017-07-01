const express = require('express');
const router = new express.Router();
const bcrypt = require('bcrypt');
const User_Account = require('./models').User_Account;
const SPIS_Instance = require('./models').SPIS_Instance;
const Doctor = require('./models').Doctor;
const Secretary = require('./models').Secretary;
const Admin = require('./models').Admin;
const Superuser = require('./models').Superuser;

function requireSuperUser(req, res, next) {
	const currentUser = req.session.user;
	const superu = req.session.superuser;
	if(!currentUser || !superu) {
		return res.redirect('/login');
	}
	next();
}

function logOut(req, res, next) {
	req.session.user = null;
	req.session.admin = null;
	req.session.doctor = null;
	req.session.secretary = null;
	req.session.superuser = null;
	next();
}

router.get('/login', function(req, res, next) {
		const currentUser = req.session.user; //req.signedCookies.user;
		const spisInstance = req.session.spisinstance;
		if(currentUser && spisInstance) {
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

			Superuser.findAll({
				raw: true,
				where: {
					id: "sayunsuperuser",
				}
			}).then(function(result){
				var superuser = {
					contact_number: result[0].contact_number,
					email: result[0].email,
				}

				res.render('account/login.html', {
					instances : instances,
					superuser: superuser,
				});
			});
		});
	}
);

router.get('/logout', function(req, res) {
	req.session.user = null;
	req.session.admin = null;
	req.session.doctor = null;
	req.session.secretary = null;
	req.session.superuser = null;
	res.redirect('/login');
});

router.post('/login', function(req, res){
	console.log(req.body);
	var username = req.body.username;
	var password = req.body.password;
	var spis_instance = req.body.spis_instance;
	// var hash = bcrypt.hashSync(password, 10);

	SPIS_Instance.findOne({where : {
		license_no: spis_instance
	}}).then(spisinstance => {
		if(!spisinstance) {
			req.flash('statusMessage', "Please select SPIS Instance");
			req.flash('username', username);
			return res.redirect('/login');
		}
		Superuser.findOne({where: {
			id: username
		}}).then(superuserInstance => {
			if(superuserInstance && bcrypt.compareSync(password, superuserInstance.dataValues.password)) {
				req.session.user = superuserInstance.dataValues;
				req.session.superuser = true;
				req.session.spisinstance = spisinstance.dataValues;
				req.session.admin = null;
				req.session.doctor = null;
				req.session.secretary = null;
				console.log(req.session);
				return res.redirect('/');
			} else {
				req.session.superuser = null
				User_Account.findOne({where: {
					id: username, spisInstanceLicenseNo: spis_instance
				}}).then (single_user => {
					if(!single_user) {
						req.flash('statusMessage', 'Wrong username and/or password.');
						req.flash('username', username);
						return res.redirect('/login');
					}
					else {
						if(bcrypt.compareSync(password, single_user.dataValues.password_hash)) {
							// res.cookie('user', single_user.dataValues, {signed: true});
							req.session.user = single_user.dataValues;
							Doctor.findOne({where: {
								usernameId: single_user.dataValues.id
							}}).then(doctorInstance => {
								if(doctorInstance) {
									req.session.doctor = doctorInstance.dataValues;
									req.session.secretary = null;
									Admin.findOne({where: {
										usernameId: single_user.dataValues.id
									}}).then(adminInstance => {
										req.session.admin = false;
										if(adminInstance) {
											req.session.admin = true;
										}
										req.session.spisinstance = spisinstance.dataValues;
										console.log(req.session);
										return res.redirect('/');
									});
								} else {
									Secretary.findOne({where: {
										usernameId: single_user.dataValues.id
									}}).then(secretaryInstance => {
										if(secretaryInstance) {
											req.session.doctor = null;
											req.session.secretary = secretaryInstance.dataValues;
											Admin.findOne({where: {
												usernameId: single_user.dataValues.id
											}}).then(adminInstance => {
												req.session.admin = false;
												if(adminInstance) {
													req.session.admin = true;
												}
												req.session.spisinstance = spisinstance.dataValues;
												console.log(req.session);
												return res.redirect('/');
											});
										} else {
											req.flash('statusMessage', "Error for unknown reason, please refresh page.");
											req.flash('username', username);
											return res.redirect('/login');
										}
									});
								}
							});
							
						} else {
							req.flash('statusMessage', "Wrong username and/or password");
							req.flash('username', username);
							return res.redirect('/');
						}
					};
				});
			}
		});
	});
});

router.get('/adminlicense', logOut, function(req, res) {
	res.render('spis_instance/su-login.html');
});

router.post('/adminlicense', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;

	Superuser.findOne({where: {
		id: username,
	}}).then(superuserInstance => {
		if(!superuserInstance) {
			req.flash('statusMessage', "Wrong username and/or password");
			req.flash('username', username);
			return res.redirect('/adminlicense');
		}
		if(bcrypt.compareSync(password, superuserInstance.dataValues.password)) {
			req.session.user = superuserInstance.dataValues;
			req.session.superuser = true;
			req.session.doctor = false;
			req.session.admin = false;
			req.session.secretary = false;
			// SPIS_Instance.findAll().then(results => {
				// console.log(results);
				res.redirect('/spis_list');
			// });
		} else {
			req.flash('statusMessage', "Wrong username and/or password");
			req.flash('username', username);
			return res.redirect('/adminlicense');
		}
	});
});

router.get('/spis_list', requireSuperUser, function(req, res) {
	 SPIS_Instance.findAll({raw: true}).then(results => {
		console.log(results);
		res.render('spis_instance/list-SPIS.html', {
			user: req.session.user,
			instances: results
		});
	});
});

router.get('/check_username/:name', requireSuperUser, function(req, res){
	var key = req.params.name;
	console.log(key);
	User_Account.findOne({
		where: {
			id: key,
		},
		raw: true
	}).then(function(result){
		if (!result) {
			res.json({exists: false});
		}
		else {
			res.json({exists: true});
		}
	});
});

// router.get('/check_license_num/:license_num', requireSuperUser, function(req, res){
// 	var key = req.params.license_num;
// 	console.log(key);
// 	Doctor.findOne({
// 		where: {
// 			license_no: key,
// 		},
// 		raw: true
// 	}).then(function(result){
// 		User_Account.findOne
// 		if (!result) {
// 			res.json({exists: false});
// 		}
// 		else {
// 			res.json({exists: true});
// 		}
// 	});
// });

// router.get('/check_ptr_num/:ptr_num', requireSuperUser, function(req, res){
// 	var key = req.params.ptr_num;
// 	console.log(key);
// 	Doctor.findOne({
// 		where: {
// 			ptr_no: key,
// 		},
// 		raw: true
// 	}).then(function(result){
// 		if (!result) {
// 			res.json({exists: false});
// 		}
// 		else {
// 			res.json({exists: true});
// 		}
// 	});
// });

// router.get('/check_s2_license_num/:s2_num', requireSuperUser, function(req, res){
// 	var key = req.params.s2_num;
// 	console.log(key);
// 	Doctor.findOne({
// 		where: {
// 			s2_license_no: key,
// 		},
// 		raw: true
// 	}).then(function(result){
// 		if (!result) {
// 			res.json({exists: false});
// 		}
// 		else {
// 			res.json({exists: true});
// 		}
// 	});
// });

module.exports = router;