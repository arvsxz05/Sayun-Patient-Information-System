const express = require('express');
const router = express.Router();
const Consultation = require('./models').Consultation;
const Check_Up = require('./models').Check_Up;
const Doctor = require('./models').Doctor;
const User_Account = require('./models').User_Account;
const Medication = require('./models').Medication;
const Medical_Procedure = require('./models').Medical_Procedure;
const multer = require('multer');
const fs = require('fs');


///////////////////// MIDDLEWARES ////////////////////////

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

var addCCfileQueue = {};

const upload_file_cc = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			if(file.fieldname == 'add-cc-attachments[]'){
				var path = './static/uploads/consultations';
				cb(null, path);
			}
		},
		filename: function (req, file, cb) {
			cb(null, Date.now()+file.originalname);
		}
	}),
});

var upload_cc_success = upload_file_cc.array('add-cc-attachments[]');

/////////////////////////////// GET ////////////////////////////////////

router.get('/clinic_consultation_list/:patient_id', requireLoggedIn,
	function (req, res, next) {
		var fileId = Date.now() + "" + Math.floor(Math.random()*10);
		res.cookie('ccFileId', fileId, { signed: true });
		addCCfileQueue[fileId] = {filesArr: []};
		next();
	},
	function (req, res) {
		var patient_id = req.params.patient_id;

		Consultation.findAll({
			raw: true,
			include: [{
		        model: Check_Up,
		        where: {
					patientId: patient_id,
				},
				as: 'parent_record',
				include: [{ 
					model: Doctor,
					include: [{ model: User_Account, as: 'username'}]
				}]
		    }]
		}).then(cc_list => {
			// console.log(cc_list);
			res.json({cc_list: cc_list});
		});
	}
);

router.get('/clinic_consultation_edit_json/:cc_id/:patient_id', requireLoggedIn, 
	function(req, res){

	console.log("AT CLINIC CONSULTATION EDIT JSON");
	console.log(req.params);

	var key = req.params.cc_id;
	var patient_id = req.params.patient_id;
	var consultation, meds = [];

	Consultation.findOne({
		raw: true,
		include: [{
			model: Check_Up,
			where: {
				patientId: patient_id,
			},
			as: 'parent_record',
			include: [{
				model: Doctor,
				include: [{
					model: User_Account,
					as: 'username',
				}],
			}],
		}],
		where: {
			id: key,
		}
	}).then(function(result){
		consultation = result;
		Medication.findAll({
			where: {
				checkUpId: consultation['parent_record.id'],
			},
			raw: true,
		}).then(function(results){
			meds = results;
			Medical_Procedure.findAll({
				where: {
					checkUpId: consultation['parent_record.id'],
				},
				raw: true,
			}).then(function(results){

				res.json({
					consultation: consultation,
					medications: meds,
					med_procedures: results,
				});
			});
		});
	});	
});


////////////////////////////// POST ////////////////////////////////////

router.post('/clinic_consultation_add', requireLoggedIn, upload_file_cc.array('add-cc-attachments[]'), function (req, res) {
	var fileId = req.signedCookies.ccFileId;

	console.log("IN CLINIC CONSULTATION ADD");
	console.log(req.body);

	var hospital = req.body['hospital'];
	var p_id = req.body['p-id'];
	var doc = req.body['doctor'];
	var summary = req.body['summary'].trim();
	var detailed = req.body['detailed-diagnosis'].trim();
	var notes = req.body['notes'].trim();
	var date = req.body['date'];
	var medication = [];
	var medical_procedure = [];

	if(req.body['meds'] != null && req.body['meds'] != ''){
		medication = req.body['meds'];
	}

	if(req.body['med_procedures'] != null && req.body['med_procedures'] != ''){
		medical_procedure = req.body['med_procedures'];
	}

	// console.log(addCCfileQueue);

	Consultation.create({
		// date: req.body['date_'].year + "-" + req.body['date_'].month + "-" + req.body['date_'].day,
		date: date,
		sum_of_diag: summary,
		detailed_diag: detailed,
		notes: notes,
		attachments: addCCfileQueue[fileId].filesArr,
		parent_record: {
			check_up_type: "Consultation",
			hospitalName: hospital,
			patientId: p_id,
			doctorId: doc,
			medication: medication,
			medical_procedure: medical_procedure,
		}
	},{
		include: [{
			model: Check_Up,
			as: 'parent_record',
			include: [{
				model: Medication,
				as: 'medication',
			}, {
				model: Medical_Procedure,
				as: 'medical_procedure',
			}]
		}]
	}).then(function(result){
		addCCfileQueue[fileId] = null;
		res.json({success: true});
	});
});

router.post('/upload_files_cc_results', requireLoggedIn, function (req, res) {
	upload_cc_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		var fileId = req.signedCookies.ccFileId;
		console.log(fileId);
		addCCfileQueue[fileId].filesArr.push(req.files[0].path);
		res.json({});
	});
});

router.post('/clinic_consultation_edit/:cc_id/:cu_id', function(req, res){
	var key = req.params.cc_id;
	var cu_id = req.params.cu_id;

	// console.log(key, cu_id);

	console.log("IN CC EDIT ROUTE");
	console.log(req.body);
	console.log(req.params);

	var date = null;//, discharge = null;

	date = req.body['date'];
	var hospital = req.body['hospital'];
	var summary = req.body['summary'];
	var details = req.body['detailed-diagnosis'];
	var notes = req.body['notes'];
	var doc = req.body['doctor'];
	
	Consultation.update({
		date: date,
		sum_of_diag: summary,
		detailed_diag: details,
		notes: notes,
	},{
		where:{
			id: key,
		}
	}).then(function(result){
		Check_Up.update({
			hospitalName: hospital,
			doctorId: doc,
		}, {
			where: {
				id: cu_id,
			}
		}).then(function(result){
			res.json({success: true});
		}).catch(function(error){
			console.log(error);
			res.json({error: error});
		});
	}).catch(function(error){
		console.log(error);
		res.json({error: error});
	});
});

router.post('/delete_files_cc/:cc_id', requireLoggedIn, function (req, res) {
	var cc_id = req.params.cc_id;
	console.log(req.body.key);
	if (fs.existsSync(req.body.key)) {
		fs.unlink(req.body.key);
	}
	Consultation.findOne({
		where: {
			id: cc_id
		}
	}).then(cc_instance => {
		// console.log(lab_instance);
		if(cc_instance) {
			var clone_arr_attachments = cc_instance.attachments.slice(0);
			var index_to_remove = clone_arr_attachments.indexOf(req.body.key);
			if (index_to_remove > -1) {
			    clone_arr_attachments.splice(index_to_remove, 1);
			}
			cc_instance.update({ attachments: clone_arr_attachments }).then(() => { return res.json({}); });
		} else {
			res.json({});
		}
	});
});

router.post("/upload_files_edit_cc/:cc_id", requireLoggedIn, function (req, res) {
	upload_cc_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		Consultation.findOne({
			where: {
				id: req.params.cc_id
			}
		}).then(cc_instance => {
			if(cc_instance) {
				var clone_arr_attachments = cc_instance.attachments.slice(0);
				clone_arr_attachments.push(req.files[0].path);
				cc_instance.update({ attachments: clone_arr_attachments }).then(() => { return res.json({}); });
			} else {
				res.json({});
			}
		});
	});
});

router.post("/clinic_consultation_edit_add_medication/:cu_id", requireLoggedIn, function (req, res) {
	var key = req.params.cu_id;

	console.log("IN CC EDIT ADD MEDICATION");
	console.log(req.body);

	Medication.create({
		name: req.body['name'],
		dosage: req.body['dosage'],
		frequency: req.body['frequency'],
		type: req.body['type'],
		notes: req.body['notes'],
		checkUpId: key
	}).then(function(result){
		res.json({id: result.id});
	});
});

router.post("/clinic_consultation_edit_add_medical_procedure/:cu_id", requireLoggedIn, function (req, res) {
	var key = req.params.cu_id;

	console.log("IN CC EDIT ADD MEDICAL PROCEDURE");
	console.log(req.body);

	Medical_Procedure.create({
		date: req.body['date'],
		description: req.body['description'],
		details: req.body['details'],
		checkUpId: key,
	}).then(function(result){
		res.json({id: result.id});
	});
});

module.exports = router;