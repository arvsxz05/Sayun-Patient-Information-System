const express = require('express');
const router = new express.Router();
const Hospital = require('./models').Hospital;

///////////////////// MIDDLEWARES ////////////////////////

function requireLoggedIn(req, res, next) {
	const currentUser = req.session.user;
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

/////////////////////// GET //////////////////////////

router.get('/hcl_add', requireLoggedIn, requireSuperUser, function (req, res) {
	res.render('account/add-hcl.html');
});

router.get('/hcl_edit/:name', requireLoggedIn, requireSuperUser, function (req, res) {
	var key = req.params.name;
	var hospital;

	Hospital.findOne({
		where: {
			name: key,
		},
		raw: true
	}).then(function(result){
		hospital = result;
		res.json(hospital);
	});
});

router.get('/hcl_list', requireLoggedIn, requireSuperAdmin, function (req, res) {
	var allHCL = [];
	Hospital.findAll({	
		raw: true,
		order: [
			['createdAt', 'DESC'],
		],
		}).then(function (results) {
			for(var i = 0; i < results.length; i++) {
				var result = results[i];
				allHCL.push({
					name: result.name,
					address: result.address,
					type: result.type,
					contact_num: result.contact_numbers,
					active: result.active,
				});
			}
			res.render('hospital/list-hospital.html', {
				hcls : allHCL,
				admin : req.session.admin,
				superuser : req.session.superuser
			});
	});
});

/////////////////////// POST //////////////////////////

router.post('/hcl_add', requireLoggedIn, requireSuperUser, function (req, res) {
	console.log("ADDING HCL");
	console.log(req.body);

	var name = req.body.name;
	var address = req.body.address;
	var type = req.body.type;
	var contact_count = req.body.count;
	var contact_num = [];

	for(var i = 1; i <= contact_count; i++) {
		if( req.body['field' + i] != undefined && req.body['field' + i].trim() != '') {
			contact_num.push( req.body['field' + i] );
		}	
	}
	Hospital.create({
		name: name,
		address: address,
		type: type,
		contact_numbers: contact_num,
	}).then(function (item) {
		res.redirect("/hcl_list");
	}).catch(function (error) {
		res.json({"status" : "error", "name": req.body.name.trim()});
	});
});

router.post('/hcl_edit', requireLoggedIn, requireSuperUser, function (req, res) {
	var name = req.body['edit-name'];
	var address = req.body['edit-address'];
	var type = req.body['edit-type'];
	var active = false;
	var contact_count = req.body['edit-count'];
	console.log(contact_count);
	var key = req.body.key;
	var contact_num = [];

	if(req.body['edit-status'] == 'Active') {
		active = true;
	}

	for(var i = 1; i <= contact_count; i++) {
		if( req.body['edit-field' + i] != undefined && req.body['edit-field' + i].trim() != ''){
			contact_num.push( req.body['edit-field' + i] );
		}	
	}

	Hospital.update({
		name: name,
		address: address,
		active: active,
		type: type,
		contact_numbers: contact_num,
	},
	{ where: {
			name: key
	}}).then(function (item) {
		// res.json({"status": "success"});
		res.redirect('/hcl_list');
	}).catch(function (error) {
		res.json({"status" : "error", "name": req.body.name});
	});
});

module.exports = router;