const express = require('express');
const router = express.Router();
const OutPatient_Treatment = require('./models').OutPatient_Treatment;
const Check_Up = require('./models').Check_Up;
const Doctor = require('./models').Doctor;
const User_Account = require('./models').User_Account;

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
		console.log(results);
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
	    }]
	}).then(function(result){
		console.log(result);
		res.json({opt: result});
	});

	// Doctor.findAll({
	// 	include: [{
	//         model: User_Account,
	//         where: {
	// 			spisInstanceLicenseNo: req.session.spisinstance.license_no,
	// 		},
	//         as: 'username',
	//     }],
	//     raw: true,
 //    }).then(function(results){

 //    	for(var i = 0; i < results.length; i++){
 //    		result = results[i];

 //    		doctors.push({
 //    			id: result.id,
 //    			last_name: result['username.last_name'],
 //    			first_name: result['username.first_name'],
 //    			middle_name: result['username.middle_name'],
 //    		});
 //    	}

 //    	OutPatient_Treatment.findOne({
	// 		raw: true,
	// 		include: [{
	// 	        model: Check_Up,
	// 	        where: {
	// 				patientId: pkey,
	// 			},
	// 	    }],
	// 	    where: {
	// 	    	id: key,
	// 	    }
	// 	}).then(function(result){

	// 		var opt = {
	// 			id: result.id,
	// 			date: result.date,
	// 			sum_of_diag: result.sum_of_diag,
	// 			detailed_diag: result.detailed_diag,
	// 			notes: result.notes,
	// 			attachments: result.attachments,
	// 			status: result.status,
	// 			doctorId: result['check_up.doctorId'],
	// 			hospital: result['check_up.hospitalName'],
	// 			check_upId: result['check_up.id'],
	// 		}

	// 		res.json({
	// 			doctors: doctors,
	// 			opt: opt,
	// 			doctor: req.session.doctor,
	// 		})
	// 	});
 //    });
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

	OutPatient_Treatment.create({
		date: date,
		sum_of_diag: summary,
		detailed_diag: details,
		notes: notes,
		parent_record: {
			check_up_type: "Out-Patient-Treatment",
			hospitalName: hospital,
			patientId: p_id,
			doctorId: doc
		}
	}, {
		include: [{
			model: Check_Up,
			as: 'parent_record'
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

	console.log(key, cu_id);

	var date = null;

	if(req.body['date_'].year != '' && req.body['date_'].month != '' && req.body['date_'].day != ''){
		date = req.body["date_"].year+"-"+req.body["date_"].month+"-"+req.body["date_"].day;
	}

	console.log(date);

	var hospital = req.body['edit-opt-hospital'];
	var summary = req.body['edit-opt-summary'];
	var details = req.body['edit-opt-detailed-diagnosis'];
	var notes = req.body['edit-opt-notes'];
	var doc = req.body['edit-opt-doctor'];

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
		}).then(function(){
			res.json({"status": "successfully updated!"});
			// res.redirect('/opt_list');
			// res.reditect('/patient_edit/'+)
		}).catch(function(error){
			console.log("in here edit ipt");
			console.log(error);
			res.send({"status": "error"});
		})

	}).catch(function(error){
		console.log(error);
		res.send({"status": "error"});
	});
});

module.exports = router;