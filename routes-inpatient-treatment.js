const express = require('express');
const router = express.Router();
const InPatient_Treatment = require('./models').InPatient_Treatment;
const Check_Up = require('./models').Check_Up;
const Doctor = require('./models').Doctor;
const User_Account = require('./models').User_Account;
const Medication = require('./models').Medication;
const Medical_Procedure = require('./models').Medical_Procedure;

///////////////////// MIDDLEWARES ////////////////////////

function requireLoggedIn(req, res, next) {
	const currentUser = req.session.user;
	if(!currentUser) {
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

//////////////////////////// GET ////////////////////////////////////

router.get('/ipt_list/:patient_id', function (req, res) {
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
});


router.get('/ipt_edit_json/:ipt_id/:patient_id', function (req, res) {

	console.log("IPT EDIT JSON");
	console.log(req.params);

	var key = req.params.ipt_id;
	var patient_id = req.params.patient_id, result;
	var doctors = [];

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
		res.json({ipt: result});
	})

});

/////////////////////////// POST ////////////////////////////////////

router.post('/ipt_add', function(req, res){

	console.log("IN IPT ADD");
	console.log(req.body);

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

	var medication = req.body['meds'];
	var medical_procedure = req.body['med_procedures'];

	InPatient_Treatment.create({
		conf_date: confine,
		discharge_date: discharge,
		sum_of_diag: summary,
		detailed_diag: details,
		notes: notes,
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
			}]
		}]
	}).then(checkUp_data => {
		res.json({success: true});
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

module.exports = router;