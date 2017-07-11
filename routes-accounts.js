const express = require('express');
const router = new express.Router();
const bcrypt = require('bcrypt');
const User_Account = require('./models').User_Account;
const Doctor = require('./models').Doctor;
const Secretary = require('./models').Secretary;
const Admin = require('./models').Admin;
const SPIS_Instance = require('./models').SPIS_Instance;
const multer = require('multer');
const avatar = multer({dest: './static/uploads/avatars'});
const signature = multer({dest: './static/uploads/signatures'});

const title_types = require('./models').title_types;

///////////////////// MIDDLEWARES ////////////////////////

function requireLoggedIn(req, res, next) {
	const currentInstance = req.session.spisinstance;
	const currentUser = req.session.user;
	if(!currentUser || !currentInstance) {
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

const upload = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {

			if(file.fieldname == 'photo'){
				var path = './static/uploads/avatars';
				cb(null, path);
			}

			if(file.fieldname == 'signature') {
				var path = './static/uploads/signatures';
				cb(null, path);
			}
		},
		filename: function (req, file, cb) {

			require('crypto').pseudoRandomBytes(16, function (err, raw) {
				if (req.fileValidationError){
					return cb(err);
				}

				cb(null, raw.toString('hex')+Date.now()+'.'+require('mime').extension(file.mimetype));
			});
		}
	}),
	fileFilter: function (req, file, cb) {
		if(!file.mimetype.includes('image')) {
			req.fileValidationError = 'not the right mimetype';
			return cb(null, false, new Error('goes wrong on the mimetype'));
		}
		cb(null, true);
	}
});

/////////////////////// GET //////////////////////////

router.get('/account_add', requireLoggedIn, requireSuperUser, function (req, res) {
	res.render('account/add-account.html', {
		title_types: title_types
	});
});

router.get('/account_list', requireLoggedIn, requireSuperAdmin, function (req, res) {
	var allAccounts = [];
	User_Account.findAll({ 
		where: {
			spisInstanceLicenseNo: req.session.spisinstance.license_no
		}, 
		raw: true
	}).then(function (results) {
		for(var i = 0; i < results.length; i++) {
			var result = results[i];
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

		res.render('account/list-accounts.html', {
			user_accounts: allAccounts,
			superuser: req.session.superuser
		});
	});
});

router.get('/account_edit/:id', requireLoggedIn, 
	upload.fields([{
		name: 'photo', maxCount: 1}, {
		name: 'signature', maxCount: 1}]),
	function (req, res, next) {
		if (!req.session.superuser && !req.session.admin && req.session.user.id != req.params.id) {
			return res.redirect('/');
		}
		next();
	}, 
	function (req, res) {
		var id = req.params.id;
		var type = {};
		var contact_nums = [];

		Secretary.findOne({
			where: {
				usernameId: id,
			},
			raw: true
		}).then(result => {
			type['Secretary'] = false;
			if( result != null ){
				type['Secretary'] = true;
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
					}).then(function (result) {
						if(result) {
							contact_nums = result.contact_numbers;
							console.log(req.session);
							res.render('account/view-edit-account.html', {
								user: result,
								type: type,
								session: req.session,
								title_types: title_types
							});
						}
						else {
							res.redirect('/');
						}
					});
				});
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
						console.log("DOCTOR");
						console.log(type['Doctor']);
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
						}).then(function (result) {
							if(result) {
								contact_nums = result.contact_numbers;
								console.log(req.session);
								res.render('account/view-edit-account.html', {
									user: result,
									type: type,
									session: req.session,
									title_types: title_types
								});
							}
							else {
								res.redirect('/');
							}
						});
					});
				});
			}
		});
	}
);

router.get('/account_edit_contacts/:id', requireLoggedIn, 
	function (req, res, next) {
		if (!req.session.superuser && !req.session.admin && req.session.user.id != req.params.id) {
			return res.redirect('/');
		}
		next();
	}, function (req, res) {
		var key = req.params.id;
		var contact_numbers = [];

		User_Account.findOne({
			where: {
				id: key,
			},
			raw: true
		}).then(function (result) {
			contact_numbers = result.contact_numbers;
			res.json(contact_numbers);
		});
	}
);

/////////////////////// POST //////////////////////////

router.post('/add_account', requireLoggedIn, requireSuperUser, 
	upload.fields([
		{name: 'photo', maxCount: 1}, 
		{name: 'signature', maxCount: 1}
	]), 
	function (req, res) {
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
		var photo = null, sign = null;

		if(req.files['photo'] != undefined) {
			photo = "/static/uploads/avatars/"+req.files['photo'][0].filename;	
		}
		if(req.files['signature'] != undefined) {
			sign = "/static/uploads/signatures/"+req.files['signature'][0].filename;	
		}

		if(email_add === "") { email_add = null; }

		if(suffix === "") { suffix = null; }

		if(is_admin === 'Admin') {
			is_admin = true;
		} else {
			is_admin = false;
		}

		for(var i = 1; i <= contact_count; i++) {
			if( (req.body['field' + i]) != undefined && (req.body['field' + i]).trim() != '') {
				contact_num.push(req.body['field' + i]);
			}
		}

		console.log(req.body.user_type)

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
					spisInstanceLicenseNo : instance.license_no,
					photo: photo,
				}
				User_Account.create(temp).then(account => {
					if (req.body.user_type == "Doctor") {
						console.log(sign);
						Doctor.create({
							license_no : license_num,
							ptr_no : ptr_num,
							s2_license_no : s2_license_num,
							usernameId: account.dataValues.id,
							signature: sign,
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
					// console.log(error);
					res.render('account/add-account.html', {
						error: error
					});
				});
			// });
		});
	}
);

router.post('/account_delete', requireLoggedIn, requireSuperUser, function (req, res) {
	var results = req.body;

	for(result in results) {
		User_Account.update({
			active: false,
		}, {
			where: {name: result},
		}).then(function (item) {
			console.log("Disabled "+item+" successfully!");
		}).catch(function (error) {
			console.log(error.stack);
		});
	}
});

router.post('/account_edit/:id', requireLoggedIn, 
	upload.fields([{
		name: 'photo', maxCount: 1}, {
		name: 'signature', maxCount: 1}]), 
	function (req, res, next) {
		if (!req.session.superuser && req.session.user.id != req.params.id) {
			return res.redirect('/');
		}
		next();
	},
	function (req, res) {
		var id = req.body.id.trim();
		var title = req.body.title.trim();
		var lname = req.body.last_name.trim();
		var fname = req.body.first_name.trim();
		var mname = req.body.middle_name.trim();
		var suffix = req.body.suffix.trim();
		var contact_count = req.body['edit-count'];
		var contact_num = [];
		var email = req.body.email_add.trim();
		var key = req.params.id;
		var photo, sign;
		if(req.files['photo'] != undefined) {
			photo = "/static/uploads/avatars/"+req.files['photo'][0].filename;	
		}
		
		if(req.files['signature'] != undefined) {
			sign = "/static/uploads/signatures/"+req.files['signature'][0].filename;	
			console.log("IN HERE SIGNATURE");
		}

		for(var i = 1; i <= contact_count; i++) {
			if( (req.body['edit-field' + i]) != undefined && (req.body['edit-field' + i]).trim() != '') {
				contact_num.push( req.body['edit-field' + i] );
			}	
		}

		User_Account.update({
			id: id,
			title: title,
			last_name: lname,
			first_name: fname,
			middle_name: mname,
			suffix: suffix,
			contact_numbers: contact_num,
			email: email,
			photo: photo,
		}, {
			where: { id: key }
		}).then(user_updated => {
			if (req.session.user.id == req.params.id) {
				req.session.user.id = id;
				//////////////////////////BEWARE/////////////////////////
			}
			if( req.body['user-type'] == 'Doctor'){
				console.log(sign);
				var lnum = req.body.license_num.trim();
				var pnum = req.body.ptr_num.trim();
				var s2num = req.body.s2_license_num.trim();
				Doctor.update({
					license_no: lnum,
					ptr_no: pnum,
					s2_license_no: s2num,
					signature: sign,
				},{ where: {
					usernameId: id
				}}).then(doctor_updated => {
					if (req.session.user.id == req.params.id) {
						req.session.doctor = doctor_updated;
					}
					return res.redirect('/account_list');
				});
			} else {
				res.redirect('/account_list');
			}
		}).catch(function (error) {
			console.log(error);
		});
	}
);

module.exports = router;