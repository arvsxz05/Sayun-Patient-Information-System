const express = require('express');
const router = express.Router();
const Patient = require('./models').Patient;
const Hospital = require('./models').Hospital;
const InPatient_Treatment = require('./models').InPatient_Treatment;
const Doctor = require('./models').Doctor;
const User_Account = require('./models').User_Account;
const Check_Up = require('./models').Check_Up;
const Laboratory = require('./models').Laboratory;
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
		return res.send("You are not authorized to access this page");
	}
	next();
}

const upload = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {

			if(file.fieldname == 'photo'){
				var path = './static/uploads/patients';
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
				cb(null, req.session.spisinstance.license_no+"_"+raw.toString('hex')+'.'+require('mime').extension(file.mimetype));
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

router.get('/patient_list', requireLoggedIn, function (req, res) {
	var allPatients = [];
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
			allPatients.push({
				id: result.id,
				last_name: result.last_name,
				first_name: result.first_name,
				middle_name: result.middle_name,
				sex: result.sex,
				age: age,
			});

		}

		res.render('patient/list-patients.html', {
			patients: allPatients,
			admin: req.session.admin,
			superuser: req.session.superuser,
		});

	}).catch(function(req, res){

	});

});

router.get('/patient_add', requireLoggedIn, function (req, res) {
	res.render('patient/add-patient.html');
});

router.get('/patient_edit/:id', requireLoggedIn, function (req, res) {
	var key = req.params.id;

	Hospital.findAll({
		where: {
			spisInstanceLicenseNo: req.session.spisinstance.license_no,
			active: "t",
		},
		attributes: ['name', 'type'],
		raw: true
	}).then(function (hospitals) {
		Patient.findOne({
			where: {
				id: key,
			},
			raw: true
		}).then(function (result) {
			var date = result.birthdate.split("-");
			patient = result;
			//Doctor Query
			Doctor.findAll({
				include: [{
			        model: User_Account,
			        where: {
						spisInstanceLicenseNo: req.session.spisinstance.license_no,
					},
					attributes: ['id', 'first_name', 'middle_name', 'last_name'],
			        as: 'username'
			    }],
			    raw: true,
			}).then(function (doctors) {

				res.render('patient/patient-info.html', {
					patient: patient,
					user: req.session.user,
					doctor: req.session.doctor,
					doctors: doctors,
					hospitals: hospitals
				});
			});
		});
	});
});

//////////////////////// POST ////////////////////////////////////

router.post('/patient_add', requireLoggedIn, upload.fields([{name: 'photo', maxCount: 1}]), function (req, res) {
	
	var photo = null;

	if(req.files['photo'] != undefined){
		photo = "/static/uploads/patients/"+req.files['photo'][0].filename;	
	}

	console.log("PATIENT ADD");
	console.log(req.body);

	var lname = req.body['last_name'];
	var fname = req.body['first_name'];
	var mname = req.body['middle_name'];
	var bday = req.body['date_']['year'][0] + "-" + req.body['date_']['month'][0] + "-" + req.body['date_']['day'][0];;
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
	var membership;
	var expiration;


	if(req.body['date_']['year'][1] != '' && req.body['date_']['month'][1] != '' && req.body['date_']['day'][1] != ''){
		membership = req.body['date_']['year'][1] + "-" + req.body['date_']['month'][1] + "-" + req.body['date_']['day'][1];
	}

	if(req.body['date_']['year'][2] != '' && req.body['date_']['month'][2] != '' && req.body['date_']['day'][2] != ''){
		expiration = req.body['date_']['year'][2] + "-" + req.body['date_']['month'][2] + "-" + req.body['date_']['day'][2];
	}

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

router.post('/patient_edit/:id', requireLoggedIn, upload.fields([{name: 'photo', maxCount: 1}]), function (req, res) {

	var photo = null;
	var key = req.params.id;

	if(req.files['photo'] !== undefined){
		photo = "/static/uploads/patients/"+req.files['photo'][0].filename;	
	}

	var patient_obj;
	var membership = null;
	var expiration = null;


	if(req.body['date_']['year'][1] != '' && req.body['date_']['month'][1] != '' && req.body['date_']['day'][1] != ''){
		membership = req.body['date_']['year'][1] + "-" + req.body['date_']['month'][1] + "-" + req.body['date_']['day'][1];
	}

	if(req.body['date_']['year'][2] != '' && req.body['date_']['month'][2] != '' && req.body['date_']['day'][2] != ''){
		expiration = req.body['date_']['year'][2] + "-" + req.body['date_']['month'][2] + "-" + req.body['date_']['day'][2];
	}

	if(photo === null) {
		patient_obj = {
			last_name: req.body['last_name'].trim(),
			middle_name: req.body['middle_name'].trim(),
			first_name: req.body['first_name'].trim(),
			suffix: req.body['suffix'].trim(),
			sex: req.body['sex'],
			birthdate: req.body['date_']['year'][0] + "-" + req.body['date_']['month'][0] + "-" + req.body['date_']['day'][0],
			nationality: req.body['nationality'].trim(),
			address: req.body['address'].trim(),
			email: req.body['email'].trim(),
			phone_number: req.body['contact1'].trim(),
			alt_cn: req.body['contact2'].trim(),
			em_cp: req.body['emergency_person'].trim(),
			rel_emcp: req.body['contact_person_rel'].trim(),
			emc_n: req.body['emergency_contact'].trim(),
			referred_by: req.body['referrer'].trim(),
			civil_status: req.body['civil_status'],
			hmo: req.body['hmo'].trim(),
			hmo_no: req.body['hmo-no'].trim(),
			membership: membership,
			expiration: expiration,
			company_name: req.body['company'].trim(),
			// insurance: req.body['insurance'].trim(),
			prior_surgeries: req.body['surgeries'].trim()
		};
	} else {
		patient_obj = {
			last_name: req.body['last_name'].trim(),
			middle_name: req.body['middle_name'].trim(),
			first_name: req.body['first_name'].trim(),
			suffix: req.body['suffix'].trim(),
			sex: req.body['sex'],
			birthdate: req.body['date_']['year'][0] + "-" + req.body['date_']['month'][0] + "-" + req.body['date_']['day'][0],
			nationality: req.body['nationality'].trim(),
			address: req.body['address'].trim(),
			email: req.body['email'].trim(),
			phone_number: req.body['contact1'].trim(),
			alt_cn: req.body['contact2'].trim(),
			em_cp: req.body['emergency_person'].trim(),
			rel_emcp: req.body['contact_person_rel'].trim(),
			emc_n: req.body['emergency_contact'].trim(),
			referred_by: req.body['referrer'].trim(),
			civil_status: req.body['civil_status'],
			hmo: req.body['hmo'].trim(),
			hmo_no: req.body['hmo-no'].trim(),
			membership: membership,
			expiration: expiration,
			company_name: req.body['company'].trim(),
			// insurance: req.body['insurance'].trim(),
			prior_surgeries: req.body['surgeries'].trim(),
			photo: photo
		};
	}


	Patient.update(patient_obj, {
		where: {
			id: key,
			spisInstanceLicenseNo: req.session.spisinstance.license_no, 
		}
	}).then(function (item) {
		res.redirect('/patient_edit/'+key);
	}).catch(function (error) {
		console.log(error);
		res.json({"status" : "error"});
	});
});

router.post('/patient_edit_notes/:id', requireLoggedIn, function (req, res) {

	var key = req.params.id;

	var f_allergies = req.body['allergies-food'];
	var m_allergies = req.body['allergies-med'];
	var pers_hh = req.body['personal-hh'];
	var imm_fam_hh = req.body['immediate-family-hh'];
	var prev_medproc = req.body['prev-med-proc'];
	var gen_notes = req.body['general-notes'];

	Patient.update({
		f_allergies: f_allergies,
		m_allergies: m_allergies,
		pers_hh: pers_hh,
		imm_fam_hh: imm_fam_hh,
		prev_medproc: prev_medproc,
		gen_notes: gen_notes,
	}, {
		where: {
			id: key,
		}
	}).then(function(result){
		res.redirect('/patient_edit/'+key);
	}).catch(function(error){
		console.log("patient edit notes error");
		console.log(error);
		res.json({"status": "error"});
	});
});

module.exports = router;