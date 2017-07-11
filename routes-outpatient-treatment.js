const express = require('express');
const router = express.Router();
const OutPatient_Treatment = require('./models').OutPatient_Treatment;
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

//////////////////////// GET ////////////////////////////////////

router.get('/opt_list/:patient_id', function(req, res){

	console.log("IN OPT LIST");

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
	}).then(function(results){
		// console.log(results);
		res.json({opt_list: results});
	});
});

router.get('/opt_add', function(req, res){

});

router.get('/opt_edit_json/:opt_id/:patient_id', function(req, res){
	console.log("OPT EDIT JSON");
	console.log(req.params);

	var key = req.params.opt_id;
	var patient_id = req.params.patient_id;
	var doctors = [];

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
			}]
	    }],
	    where: {
	    	id: key,
	    }
	}).then(function(result){
		// console.log(result);
		res.json({opt: result});
	});
});


//////////////////////// POST ////////////////////////////////////

router.post('/opt_add', function(req, res){

	console.log("OPT ADD");
	console.log(req.body);

	var date = req.body['opt-date'];
	var hospital = req.body['hospital'];
	var summary = req.body['summary'].trim();
	var details = req.body['detailed-diagnosis'].trim();
	var notes = req.body['notes'].trim();
	var p_id = req.body['p-id'];
	var doc = req.body['doctor'];
	var discharge = null;

	var medication = req.body['meds'];
	var medical_procedure = req.body['med_procedures'];

	OutPatient_Treatment.create({
		date: date,
		sum_of_diag: summary,
		detailed_diag: details,
		notes: notes,
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
			}],
			include: [{
				model: Medical_Procedure,
				as: 'medical_procedure',
			}]
		}]
	}).then(checkUp_data => {
		res.json({success: true});
	});
});

router.post('/opt_edit/:opt_id/:cu_id', function(req, res){
	var key = req.params.opt_id;
	var cu_id = req.params.cu_id;

	console.log("IN OPT EDIT");
	console.log(req.body);

	console.log(key);

	var date = null;

	// if(req.body['date_'].year != '' && req.body['date_'].month != '' && req.body['date_'].day != ''){
	// 	date = req.body["date_"].year+"-"+req.body["date_"].month+"-"+req.body["date_"].day;
	// }

	// console.log(date);
	var date = req.body['date'];
	var hospital = req.body['hospital'];
	var summary = req.body['summary'];
	var details = req.body['detailed-diagnosis'];
	var notes = req.body['notes'];
	var doc = req.body['doctor'];

	var checkup_id;

	// OutPatient_Treatment.update({
	// 	date: date,
	// 	sum_of_diag: summary,
	// 	detailed_diag: details,
	// 	notes: notes,
	// 	parent_record: {
	// 		hospitalName: hospital,
	// 		doctorId: doc
	// 	}
	// },{
	// 	where: {
	// 		id: key,
	// 	}		
	// // }, {
	// // 	include: [{
	// // 		model: Check_Up,
	// // 		as: 'parent_record'
	// // 	}]
	// }).then(checkUp_data => {
	// 	res.json({success: true});
	// });


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

module.exports = router;