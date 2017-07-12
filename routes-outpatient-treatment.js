const express = require('express');
const router = express.Router();
const OutPatient_Treatment = require('./models').OutPatient_Treatment;
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
		// return res.redirect('/login');
		return res.send("You are not authorized to access this page");
	}
	next();
}

var addOPTfileQueue = {};

const upload_file_opts = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			if(file.fieldname == 'add-opt-attachments[]'){
				var path = './static/uploads/OPTs';
				cb(null, path);
			}
		},
		filename: function (req, file, cb) {
			cb(null, Date.now()+file.originalname);
		}
	}),
});

var upload_opt_success = upload_file_opts.array('add-opt-attachments[]');

//////////////////////// GET ////////////////////////////////////

router.get('/opt_list/:patient_id', 
	function (req, res, next) {
		var fileId = Date.now() + "" + Math.floor(Math.random()*10);
		res.cookie('optFileId', fileId, { signed: true });
		addOPTfileQueue[fileId] = {filesArr: []};
		next();
	},
	function (req, res) {
		var patient_id = req.params.patient_id;

		OutPatient_Treatment.findAll({
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
		}).then(function (results) {
			res.json({opt_list: results});
		});
	}
);

router.get('/opt_edit_json/:opt_id/:patient_id', function (req, res) {
	console.log("OPT EDIT JSON");
	console.log(req.params);

	var key = req.params.opt_id;
	var patient_id = req.params.patient_id;
	var doctors = [];
	var opt, meds;

	OutPatient_Treatment.findOne({
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
			}],
	    }],
	    where: {
	    	id: key,
	    }
	}).then(function (result) {
		opt = result;
		Medication.findAll({
			where: {
				checkUpId: opt['parent_record.id'],
			},
			raw: true,
		}).then(function (results) {
			meds = results;
			Medical_Procedure.findAll({
				where: {
					checkUpId: opt['parent_record.id'],
				},
				raw: true,
			}).then(function (results) {
				res.json({	
					opt: opt,
					medications: meds,
					med_procedures: results
				});
			});
		});
	});
});


//////////////////////// POST ////////////////////////////////////

router.post('/opt_add', upload_file_opts.array('add-opt-attachments[]'), function (req, res) {
	var fileId = req.signedCookies.optFileId;

	var date = req.body['opt-date'];
	var hospital = req.body['hospital'];
	var summary = req.body['summary'].trim();
	var details = req.body['detailed-diagnosis'].trim();
	var notes = req.body['notes'].trim();
	var p_id = req.body['p-id'];
	var doc = req.body['doctor'];
	var discharge = null;

	var medication = [];
	var medical_procedure = [];

	if(req.body['meds'] != null && req.body['meds'] != ''){
		medication = req.body['meds'];
	}

	if(req.body['med_procedures'] != null && req.body['med_procedures'] != ''){
		medical_procedure = req.body['med_procedures'];
		console.log("MED PROC");
	}

	OutPatient_Treatment.create({
		date: date,
		sum_of_diag: summary,
		detailed_diag: details,
		notes: notes,
		attachments: addOPTfileQueue[fileId].filesArr,
		parent_record: {
			check_up_type: "Out-Patient-Treatment",
			hospitalName: hospital,
			patientId: p_id,
			doctorId: doc,
			medication: medication,
			medical_procedure: medical_procedure,
		}
	}, {
		include: [{
			model: Check_Up,
			as: 'parent_record',
			include: [{
				model: Medication,
				as: 'medication'
			}, {
				model: Medical_Procedure,
				as: 'medical_procedure',
			}],
		}]
	}).then(checkUp_data => {
		addOPTfileQueue[fileId] = null;
		res.json({success: true});
	});
});

router.post('/upload_files_opt', requireLoggedIn, function (req, res) {
	upload_opt_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		var fileId = req.signedCookies.optFileId;
		addOPTfileQueue[fileId].filesArr.push(req.files[0].path);
		res.json({});
	});
});

router.post('/opt_edit/:opt_id/:cu_id', function(req, res){
	var key = req.params.opt_id;
	var cu_id = req.params.cu_id;

	var date = null;

	// if(req.body['date_'].year != '' && req.body['date_'].month != '' && req.body['date_'].day != ''){
	// 	date = req.body["date_"].year+"-"+req.body["date_"].month+"-"+req.body["date_"].day;
	// }

	var date = req.body['date'];
	var hospital = req.body['hospital'];
	var summary = req.body['summary'];
	var details = req.body['detailed-diagnosis'];
	var notes = req.body['notes'];
	var doc = req.body['doctor'];

	var checkup_id;

	OutPatient_Treatment.update({
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

router.post('/delete_files_opt/:opt_id', requireLoggedIn, function (req, res) {
	var opt_id = req.params.opt_id;
	console.log(req.body.key);
	if (fs.existsSync(req.body.key)) {
		fs.unlink(req.body.key);
	}
	InPatient_Treatment.findOne({
		where: {
			id: opt_id
		}
	}).then(opt_instance => {
		// console.log(lab_instance);
		if(opt_instance) {
			var clone_arr_attachments = opt_instance.attachments.slice(0);
			var index_to_remove = clone_arr_attachments.indexOf(req.body.key);
			if (index_to_remove > -1) {
			    clone_arr_attachments.splice(index_to_remove, 1);
			}
			opt_instance.update({ attachments: clone_arr_attachments }).then(() => { return res.json({}); });
		} else {
			res.json({});
		}
	});
});

router.post("/upload_files_edit_opt/:opt_id", requireLoggedIn, function (req, res) {
	upload_opt_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		InPatient_Treatment.findOne({
			where: {
				id: req.params.opt_id
			}
		}).then(opt_instance => {
			if(opt_instance) {
				var clone_arr_attachments = opt_instance.attachments.slice(0);
				clone_arr_attachments.push(req.files[0].path);
				opt_instance.update({ attachments: clone_arr_attachments }).then(() => { return res.json({}); });
			} else {
				res.json({});
			}
		});
	});
});

module.exports = router;