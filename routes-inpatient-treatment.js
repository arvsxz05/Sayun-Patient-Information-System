const express = require('express');
const router = express.Router();
const InPatient_Treatment = require('./models').InPatient_Treatment;
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

var addIPTfileQueue = {};

const upload_file_ipts = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			if(file.fieldname == 'add-ipt-attachments[]'){
				var path = './static/uploads/IPTs';
				cb(null, path);
			}
		},
		filename: function (req, file, cb) {
			cb(null, Date.now()+file.originalname);
		}
	}),
});

var upload_ipt_success = upload_file_ipts.array('add-ipt-attachments[]');

//////////////////////////// GET ////////////////////////////////////

router.get('/ipt_list/:patient_id',
	function (req, res, next) {
		var fileId = Date.now() + "" + Math.floor(Math.random()*10);
		res.cookie('iptFileId', fileId, { signed: true });
		addIPTfileQueue[fileId] = {filesArr: []};
		next();
	},
	function (req, res) {
		var patient_id = req.params.patient_id;

		InPatient_Treatment.findAll({
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
		}).then(ipt_list => {
			res.json({ipt_list: ipt_list});
		});
	}
);


router.get('/ipt_edit_json/:ipt_id/:patient_id', function (req, res) {

	var key = req.params.ipt_id;
	var patient_id = req.params.patient_id, result;
	var doctors = [];
	var ipt, meds;

	InPatient_Treatment.findOne({
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
					as: 'username'
				}],
			}],
		}],
		where: {
				id: key,
			}
	}).then(function(result){
		// console.log("INPATIENT TREATMENT EDIT JSON");
		// console.log(result);
		ipt = result;
		Medication.findAll({
			where: {
				checkUpId: ipt['parent_record.id'],
			},
			raw: true,
		}).then(function(results){
			meds = results;
			Medical_Procedure.findAll({
				where: {
					checkUpId: ipt['parent_record.id'],
				},
				raw: true,
			}).then(function(results){
				res.json({	ipt: ipt,
							medications: meds,
							med_procedures: results});
			});
		});
	});

});

/////////////////////////// POST ////////////////////////////////////

router.post('/ipt_add', requireLoggedIn, upload_file_ipts.array('add-ipt-attachments[]'), function (req, res) {
	var fileId = req.signedCookies.iptFileId;

	var confine = req.body['confinement-date'];
	var hospital = req.body['hospital'];
	var summary = req.body['summary'].trim();
	var details = req.body['detailed-diagnosis'].trim();
	var notes = req.body['notes'].trim();
	var p_id = req.body['p-id'];
	var doc = req.body['doctor'];
	var discharge = null;

	if(req.body['discharge-date'] && req.body['discharge-date'].trim() !== "") {
		discharge = req.body['discharge-date'];
	};

	var medication = [];
	var medical_procedure = [];

	if(req.body['meds'] != null && req.body['meds'] != ''){
		medication = req.body['meds'];
	}

	if(req.body['med_procedures'] != null && req.body['med_procedures'] != ''){
		medical_procedure = req.body['med_procedures'];
	}

	InPatient_Treatment.create({
		conf_date: confine,
		discharge_date: discharge,
		sum_of_diag: summary,
		detailed_diag: details,
		notes: notes,
		attachments: addIPTfileQueue[fileId].filesArr,
		parent_record: {
			check_up_type: "In-Patient-Treatment",
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
		addIPTfileQueue[fileId] = null;
		res.json({success: true});
	});
});

router.post('/upload_files_ipt_results', requireLoggedIn, function (req, res) {
	upload_ipt_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		var fileId = req.signedCookies.iptFileId;
		addIPTfileQueue[fileId].filesArr.push(req.files[0].path);
		res.json({});
	});
});

router.post('/ipt_edit/:ipt_id/:cu_id', function(req, res){
	var key = req.params.ipt_id;
	var cu_id = req.params.cu_id;

	// console.log(key, cu_id);

	var confine = null, discharge = null;

	// if(req.body['date_']['year'][0] != '' && req.body['date_']['month'][0] != '' && req.body['date_']['day'][0] != ''){
	// 	confine = req.body["date_"]["year"][0]+"-"+req.body["date_"]["month"][0]+"-"+req.body["date_"]["day"][0];
	// }

	// if(req.body['date_']['year'][1] != '' && req.body['date_']['month'][1] != '' && req.body['date_']['day'][1] != ''){
	// 	discharge = req.body["date_"]["year"][1]+"-"+req.body["date_"]["month"][1]+"-"+req.body["date_"]["day"][1];
	// }

	var dis_date = req.body['discharge-date'].split("-");
	console.log(dis_date);
	if((dis_date[0] != "" && dis_date[1] != "" && dis_date[2] != "") && (dis_date[0] != 'null' && dis_date[1] != 'null' && dis_date[2] != 'null') ){
		discharge = req.body['discharge-date'];
		console.log("DISCHARGE DATE");
	}

	confine = req.body['confinement-date'];
	var hospital = req.body['hospital'];
	var summary = req.body['summary'];
	var details = req.body['detailed-diagnosis'];
	var notes = req.body['notes'];
	var doc = req.body['doctor'];
	
	InPatient_Treatment.update({
		conf_date: confine,
		discharge_date: discharge,
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

router.post('/delete_files_ipt/:ipt_id', requireLoggedIn, function (req, res) {
	var ipt_id = req.params.ipt_id;
	console.log(req.body.key);
	if (fs.existsSync(req.body.key)) {
		fs.unlink(req.body.key);
	}
	InPatient_Treatment.findOne({
		where: {
			id: ipt_id
		}
	}).then(ipt_instance => {
		// console.log(lab_instance);
		if(ipt_instance) {
			var clone_arr_attachments = ipt_instance.attachments.slice(0);
			var index_to_remove = clone_arr_attachments.indexOf(req.body.key);
			if (index_to_remove > -1) {
			    clone_arr_attachments.splice(index_to_remove, 1);
			}
			ipt_instance.update({ attachments: clone_arr_attachments }).then(() => { return res.json({}); });
		} else {
			res.json({});
		}
	});
});

router.post("/upload_files_edit_ipt/:ipt_id", requireLoggedIn, function (req, res) {
	upload_ipt_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		InPatient_Treatment.findOne({
			where: {
				id: req.params.ipt_id
			}
		}).then(ipt_instance => {
			if(ipt_instance) {
				var clone_arr_attachments = ipt_instance.attachments.slice(0);
				clone_arr_attachments.push(req.files[0].path);
				ipt_instance.update({ attachments: clone_arr_attachments }).then(() => { return res.json({}); });
			} else {
				res.json({});
			}
		});
	});
});

router.post("/ipt_edit_add_medication/:cu_id", requireLoggedIn, function (req, res) {
	var key = req.params.cu_id;
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

router.post("/ipt_edit_add_medical_procedure/:cu_id", requireLoggedIn, function (req, res) {
	var key = req.params.cu_id;
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