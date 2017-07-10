const express = require('express');
const router = express.Router();
const InPatient_Treatment = require('./models').InPatient_Treatment;
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
	var pkey = req.params.patient_id, result;
	var doctors = [];

	Doctor.findAll({
		include: [{
	        model: User_Account,
	        where: {
				spisInstanceLicenseNo: req.session.spisinstance.license_no,
			},
	        as: 'username',
	    }],
	    raw: true,
    }).then(function(results){

    	for(var i = 0; i < results.length; i++){
    		result = results[i];

    		doctors.push({
    			id: result.id,
    			last_name: result['username.last_name'],
    			first_name: result['username.first_name'],
    			middle_name: result['username.middle_name'],
    		});
    	}

    	InPatient_Treatment.findOne({
			raw: true,
			include: [{
		        model: Check_Up,
		        where: {
					patientId: pkey,
				},
				as: 'parent_record'
		    }],
		    where: {
		    	id: key,
		    }
		}).then(function(result){

			var ipt = {
				id: result.id,
				conf_date: result.conf_date,
				discharge_date: result.discharge_date,
				sum_of_diag: result.sum_of_diag,
				detailed_diag: result.detailed_diag,
				notes: result.notes,
				attachments: result.attachments,
				status: result.status,
				doctorId: result['parent_record.doctorId'],
				hospital: result['parent_record.hospitalName'],
				check_upId: result['parent_record.id'],
			}

			res.json({
				doctors: doctors,
				ipt: ipt,
				doctor: req.session.doctor,
			})
		});
    });
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

	if(!req.body['discharge-date'] && req.body['discharge-date'].trim() !== "") {
		discharge = req.body['discharge-date'];
	};

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

router.post('/ipt_edit/:ipt_id/:cu_id', function(req, res){
	var key = req.params.ipt_id;
	var cu_id = req.params.cu_id;

	console.log(key, cu_id);

	var confine = null, discharge = null;

	if(req.body['date_']['year'][0] != '' && req.body['date_']['month'][0] != '' && req.body['date_']['day'][0] != ''){
		confine = req.body["date_"]["year"][0]+"-"+req.body["date_"]["month"][0]+"-"+req.body["date_"]["day"][0];
	}

	if(req.body['date_']['year'][1] != '' && req.body['date_']['month'][1] != '' && req.body['date_']['day'][1] != ''){
		discharge = req.body["date_"]["year"][1]+"-"+req.body["date_"]["month"][1]+"-"+req.body["date_"]["day"][1];
	}

	var hospital = req.body['edit-hospital'];
	var summary = req.body['edit-summary'];
	var details = req.body['edit-detailed-diagnosis'];
	var notes = req.body['edit-notes'];
	var doc = req.body['edit-doctor'];

	var checkup_id;

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
		}).then(function(){
			res.json({"status": "successfully updated!"});
		}).then(function(error){
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