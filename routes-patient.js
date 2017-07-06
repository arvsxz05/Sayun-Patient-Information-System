const express = require('express');
const router = express.Router();
const Patient = require('./models').Patient;
const multer = require('multer');
const Sequelize = require('sequelize');

///////////////////// MIDDLEWARES ////////////////////////

function get_age(born, now) {
	var birthday = new Date(now.getFullYear(), born.getMonth(), born.getDate());
	if (now >= birthday) 
		return now.getFullYear() - born.getFullYear();
	else
		return now.getFullYear() - born.getFullYear() - 1;

	next();
}

function requireLoggedIn(req, res, next) {
	const currentInstance = req.session.spisinstance;
	const currentUser = req.session.user;
	if(!currentUser || !currentInstance) {
		return res.redirect('/login');
	}
	next();
}

function requireDoctor(req, res, next) {
	const currentUser = req.session.doctor;
	if(!currentUser) {
		// return res.redirect('/login');
		return res.send("You are not authorized to access this page");
	}
	next();
}

const upload = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {

			if(file.fieldname == 'photo'){
				console.log("IN HERE")
				var path = './uploads/patients';
				cb(null, path);
			}
		},
		filename: function (req, file, cb) {
			console.log("IN UPLOAD MULTER");
			console.log(req.session);
			console.log(req.file);

			require('crypto').pseudoRandomBytes(8, function (err, raw) {
				if (req.fileValidationError){
					console.log("error");
					console.log(err);
					return cb(err);
				}

				cb(null, req.session.spisinstance.license_no+"_"+raw.toString('hex')+'.'+require('mime').extension(file.mimetype)); //"_"+file.originalname)
			});
		}
	}),
	fileFilter: function (req, file, cb) {
		if(!file.mimetype.includes('image')) {
			req.fileValidationError = 'not the right mimetype';
			console.log("NOT THE RIGHT MIMETYPE");
			return cb(null, false, new Error('goes wrong on the mimetype'));
		}
		cb(null, true);
	}
});

//////////////////////// GET ////////////////////////////////////

router.get('/patient_list', requireLoggedIn, function(req, res){
	var allPatients = [];
	console.log("IN HERE PATIENT LIST");
	Patient.findAll({
		where: {
			spisInstanceLicenseNo: req.session.spisinstance.license_no
		},
		raw: true,
		order: [
			['createdAt', 'DESC'],
		],
	}).then(function(results){
		var result, age;
		for(var i = 0; i < results.length; i++){
			result = results[i];

			age = get_age( new Date(result.birthdate), new Date());
			console.log("IN HERE LOOP RESULTS");
			allPatients.push({
				id: result.id,
				last_name: result.last_name,
				first_name: result.first_name,
				middle_name: result.middle_name,
				sex: result.sex,
				age: age,
			});

		}

		console.log(allPatients);

		res.render('patient/list-patients.html', {
			patients: allPatients,
			admin: req.session.admin,
			superuser: req.session.superuser,
		});

	}).catch(function(req, res){

	});

});

router.get('/patient_add', requireLoggedIn, function(req, res){
	res.render('patient/add-patient.html');
});

router.get('/patient_edit/:id', requireLoggedIn, function(req, res){

	var key = req.params.id;

	Patient.findOne({
		where: {
			id: key,
		},
		raw: true,
	}).then(function(result){
		console.log("went here");
		var date = result.birthdate.split("-");

		res.render('patient/patient-info.html', {
			patient: result,
			year: date[0],
			month: date[1],
			day: date[2],
			user: req.session.user,
		});

	}).catch(function(error){

	});

});

router.get('/patient_edit_json/:id', requireLoggedIn, function(req, res){

	var key = req.params.id;

	Patient.findOne({
		where: {
			id: key,
		},
		raw: true,
	}).then(function(result){
		console.log("went here");
		var date = result.birthdate.split("-");

		res.json(result);

	}).catch(function(error){

	});

});


//////////////////////// POST ////////////////////////////////////

router.post('/patient_add', requireLoggedIn, upload.single('photo'), function(req, res){
	
	var photo = null;

	if(req.body['photo'] != undefined){
		photo = req.body['photo'];
	}

	console.log("PATIENT ADD");
	console.log(req.body);

	var lname = req.body['last_name'];
	var fname = req.body['first_name'];
	var mname = req.body['middle_name'];
	var bday = req.body['date'];
	var birthday = req.body['date_'].month+"-"+req.body['date_'].day+"-"+req.body['date_'].year;
	var sex = req.body['sex'];
	var cstatus = req.body['civil_status'];
	var nationality = req.body['nationality'];
	var referral = req.body['referral'];
	var insurance = req.body['insurance'];
	var surgeries = req.body['surgeries'];
	var address = req.body['address'];
	var email = req.body['email'];
	var contact1 = req.body['contact1'];
	var contact2 = req.body['contact2'];
	var empers = req.body['emergency_person'];
	var emcont = req.body['emergency_contact'];
	var emcont_rel = req.body['contact_person_rel'];
	var suffix = req.body['suffix'];
	var referrer = req.body['referrer'];
	var hmo = req.body['hmo'];
	var hmo_no = req.body['hmo-no'];
	var company_name = req.body['company'];
	var membership = req.body['membership'];
	var expiration = req.body['expiration'];

	Patient.create({
		last_name: lname,
		middle_name: mname,
		first_name: fname,
		suffix: suffix,
		sex: sex,
		birthdate: bday,
		nationality: nationality,
		address: address,
		email: email,
		phone_number: contact1,
		alt_cn: contact2,
		em_cp: empers,
		rel_emcp: emcont_rel,
		emc_n: emcont,
		referred_by: referrer,
		civil_status: cstatus,
		spisInstanceLicenseNo: req.session.spisinstance.license_no,
		photo: photo,
		hmo: hmo,
		hmo_no: hmo_no,
		membership: membership,
		expiration: expiration,
		company_name: company_name,
		insurance: insurance,
		prior_surgeries: surgeries
	}).then(function (item) {
		res.redirect("/patient_list");
	}).catch(function (error) {
		console.log(error);
		res.json({"status" : "error"});
	});


});

router.post('/patient_edit/:id', requireLoggedIn, upload.single('photo'), function(req, res){
	var photo = null;
	var key = req.params.id;

	if(req.body['photo'] != undefined){
		photo = req.body['photo'];
	}

	console.log(req.body);

	var lname = req.body['last_name'];
	var fname = req.body['first_name'];
	var mname = req.body['middle_name'];
	var bday = req.body['date'];
	var sex = req.body['sex'];
	var cstatus = req.body['civil_status'];
	var nationality = req.body['nationality'];
	var referral = req.body['referral'];
	var insurance = req.body['insurance'];
	var surgeries = req.body['surgeries'];
	var address = req.body['address'];
	var email = req.body['email'];
	var contact1 = req.body['contact1'];
	var contact2 = req.body['contact2'];
	var empers = req.body['emergency_person'];
	var emcont = req.body['emergency_contact'];
	var emcont_rel = req.body['contact_person_rel'];
	var suffix = req.body['suffix'];
	var referrer = req.body['referrer'];
	var hmo = req.body['hmo'];
	var hmo_no = req.body['hmo_no'];
	var company_name = req.body['company'];
	var membership = req.body['membership'];
	var expiration = req.body['expiration'];

	Patient.update({
		last_name: lname,
		middle_name: mname,
		first_name: fname,
		suffix: suffix,
		sex: sex,
		birthdate: bday,
		nationality: nationality,
		address: address,
		email: email,
		phone_number: contact1,
		alt_cn: contact2,
		em_cp: empers,
		rel_emcp: emcont_rel,
		emc_n: emcont,
		referred_by: referrer,
		civil_status: cstatus,
		photo: photo,
		hmo: hmo,
		hmo_no: hmo_no,
		membership: membership,
		expiration: expiration,
		company_name: company_name,
		insurance: insurance,
		prior_surgeries: surgeries
	},
	{
		where: {
			id: key,
			spisInstanceLicenseNo: req.session.spisinstance.license_no, 
		}
	}).then(function (item) {
		res.redirect("/patient_list");
	}).catch(function (error) {
		console.log(error);
		res.json({"status" : "error"});
	});
});


module.exports = router;