const express = require('express');
const router = express.Router();
const Consultation = require('./models').Consultation;
const Check_Up = require('./models').Check_Up;
const Doctor = require('./models').Doctor;
const User_Account = require('./models').User_Account;
const Medication = require('./models').Medication;
const Medical_Procedure = require('./models').Medical_Procedure;
const multer = require('multer');


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

var addLabfileQueue = {};

const upload_file_labs = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			if(file.fieldname == 'add-lab-attachments[]'){
				var path = './static/uploads/lab_results';
				cb(null, path);
			}
		},
		filename: function (req, file, cb) {
			cb(null, Date.now()+file.originalname);
		}
	}),
});

var upload_success = upload_file_labs.array('add-lab-attachments[]');

/////////////////////////////// GET ////////////////////////////////////

router.get('/clinic_consultation_list/:patient_id', requireLoggedIn, 
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
			console.log(cc_list);
			res.json({cc_list: cc_list});
		});
	}
);


////////////////////////////// POST ////////////////////////////////////

router.post('/clinic_consultation_add', requireLoggedIn, function (req, res) {

	console.log("IN CLINIC CONSULTATION ADD");
	console.log(req.body);

	var hospital = req.body['hospital'];
	var p_id = req.body['p-id'];
	var doc = req.body['doctor'];
	var summary = req.body['summary'].trim();
	var detailed = req.body['detailed-diagnosis'].trim();
	var notes = req.body['notes'].trim();
	var date = req.body['date'];

	Consultation.create({
		// date: req.body['date_'].year + "-" + req.body['date_'].month + "-" + req.body['date_'].day,
		date: date,
		sum_of_diag: summary,
		detailed_diag: detailed,
		notes: notes,
		parent_record: {
			check_up_type: "Consultation",
			hospitalName: hospital,
			patientId: p_id,
			doctorId: doc,
			// medication: medication,
			// medical_procedure: medical_procedure,
		}
		// attachments: req.body[''],
	},{
		include: [{
			model: Check_Up,
			as: 'parent_record',
		}]
	}).then(function(result){
		res.json({success: true})
	});

});
	
module.exports = router;