const express = require('express');
const router = express.Router();
const Consultation = require('../models/database').Consultation;
const Check_Up = require('../models/database').Check_Up;
const Doctor = require('../models/database').Doctor;
const User_Account = require('../models/database').User_Account;
const Medication = require('../models/database').Medication;
const Medical_Procedure = require('../models/database').Medical_Procedure;
const Billing_Item = require('../models/database').Billing_Item;
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
		var fileId = req.signedCookies.ccFileId;
		addCCfileQueue[fileId] = null;
		fileId = Date.now() + "" + Math.floor(Math.random()*10);
		res.cookie('ccFileId', fileId, { signed: true });
		addCCfileQueue[fileId] = {filesArr: []};
		next();
	},
	function (req, res) {
		var patient_id = req.params.patient_id;

		if(req.session.doctor) {
			Consultation.findAll({
				raw: true,
				include: [{
			        model: Check_Up,
			        where: {
						patientId: patient_id,
						active: true,
					},
					as: 'parent_record',
					include: [{ 
						model: Doctor,
						where: { id: req.session.doctor.id },
						include: [{ model: User_Account, as: 'username'}]
					}]
			    }],
			    where: {
			    	active: true
			    }
			}).then(cc_list => {
				res.json({cc_list: cc_list});
			});
		} else if (req.session.secretary) {
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
				res.json({cc_list: cc_list});
			});
		} else {
			res.send("You are not given access here.");
		}
	}
);

router.get('/clinic_consultation_edit_json/:cc_id/:patient_id', requireLoggedIn, function (req, res) {

	var key = req.params.cc_id;
	var patient_id = req.params.patient_id;

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
	}).then(consultation_instance => {
		Medication.findAll({
			where: {
				checkUpId: consultation_instance['parent_record.id'],
			},
			raw: true,
		}).then(medication_list => {
			Medical_Procedure.findAll({
				where: {
					checkUpId: consultation_instance['parent_record.id'],
				},
				raw: true,
			}).then(procedures_list => {
				Billing_Item.findAll({
					where: {
						checkUpId: consultation_instance['parent_record.id'],
					}
				}).then(billing_items_list => {
					res.json({
						consultation: consultation_instance,
						medications: medication_list,
						med_procedures: procedures_list,
						billing_items: billing_items_list
					});
				});
			});
		});
	});	
});

router.get("/clinic_consultation_delete/:cc_id", requireLoggedIn, function(req, res){
	console.log("CC DELETE");
	console.log(req.params);
	var key = req.params.cc_id;
	var cc, hasChildRecords;

	Consultation.findOne({
		where: {
			id: key,
			active: true,
		},
		raw: true,
		attributes: ['id', 'parentRecordId'],
	}).then(function(cc_instance){
		console.log(cc_instance);
		Medication.findAll({
			where: {
				checkUpId: cc_instance['parentRecordId'],
			},
			raw: true,
			attributes: ['id'],
		}).then(function(medication_list){
			Medical_Procedure.findAll({
				where: {
					checkUpId: cc_instance['parentRecordId'],
				},
				raw: true,
				attributes: ['id'],
			}).then(function(med_proc_list){
				if(medication_list.length+med_proc_list.length > 0)
					hasChildRecords = true;
				else
					hasChildRecords = false;
				
				res.json({
					hasChildRecords: hasChildRecords,
					meds_count: medication_list.length,
					medical_procedure_count: med_proc_list.length,
				});
			});
		});
	});
});

////////////////////////////// POST ////////////////////////////////////

router.post('/clinic_consultation_add', requireLoggedIn, upload_file_cc.array('add-cc-attachments[]'), function (req, res) {
	var fileId = req.signedCookies.ccFileId;

	var hospital = req.body['hospital'];
	var p_id = req.body['p-id'];
	var doc = req.body['doctor'];
	var date = req.body['date'];

	if(req.session.doctor) {
		var summary = req.body['summary'].trim();
		var detailed = req.body['detailed-diagnosis'].trim();
		var notes = req.body['notes'].trim();
		var medication = [];
		var medical_procedure = [];
		var billing = [];

		if(req.body['meds'] != null && req.body['meds'] != ''){
			medication = req.body['meds'];
		}

		if(req.body['med_procedures'] != null && req.body['med_procedures'] != ''){
			medical_procedure = req.body['med_procedures'];
		}

		if(req.body['billings'] != null && req.body['billings'] != '') {
			billing = req.body['billings'];
		}

		fields = {
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
		};
		includes = {
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
		};
	} else if (req.session.secretary) {
		fields = {
			date: date,
			attachments: [],
			parent_record: {
				check_up_type: "Consultation",
				hospitalName: hospital,
				patientId: p_id,
				doctorId: doc
			}
		};
		includes = {
			include: [{
				model: Check_Up,
				as: 'parent_record'
			}]
		};
	}
	Consultation.create(fields, includes).then(consultation_instance => {
		addCCfileQueue[fileId] = null;
		var itemsProcessed = 0;
		if(req.session.doctor){
			if (consultation_instance.parent_record.medication.length > 0) {
				consultation_instance.parent_record.medication.forEach(function (medication_item) {
					console.log(medication_item.dataValues.id);
					Billing_Item.create({
						description: medication_item.dataValues.name,
						last_edited: req.session.user.id,
						checkUpId: medication_item.dataValues.checkUpId,
						receiptId: medication_item.dataValues.id,
						issued_by: req.session.user.id,
					}).then(billing_item_instance => {
						itemsProcessed++;
						if(itemsProcessed === consultation_instance.parent_record.medication.length) {
							itemsProcessed = 0;
							if (consultation_instance.parent_record.medical_procedure.length > 0) {
								consultation_instance.parent_record.medical_procedure.forEach(function (medical_procedure_item) {
									console.log(medical_procedure_item.dataValues.id);
									Billing_Item.create({
										description: medical_procedure_item.dataValues.description,
										last_edited: req.session.user.id,
										checkUpId: medical_procedure_item.dataValues.checkUpId,
										receiptId: medical_procedure_item.dataValues.id,
										issued_by: req.session.user.id,
									}).then(billing_item_instance => {
										itemsProcessed++;
										if(itemsProcessed === consultation_instance.parent_record.medical_procedure.length) {
											res.json({success: true});
										}
									});
								});
							} else {
								res.json({success: true});
							}
						}
					});
				});
			} else if (consultation_instance.parent_record.medical_procedure.length > 0) {
				consultation_instance.parent_record.medical_procedure.forEach(function (medical_procedure_item) {
					console.log(medical_procedure_item.dataValues.id);
					Billing_Item.create({
						description: medical_procedure_item.dataValues.description,
						last_edited: req.session.user.id,
						checkUpId: medical_procedure_item.dataValues.checkUpId,
						receiptId: medical_procedure_item.dataValues.id,
						issued_by: req.session.user.id,
					}).then(billing_item_instance => {
						itemsProcessed++;
						if(itemsProcessed === consultation_instance.parent_record.medical_procedure.length) {
							res.json({success: true});
						}
					});
				});
			} else {
				res.json({success: true});
			}
		} else{
			res.json({success: true});
		}
	}).catch(error => {
		console.log(error);
		res.json({error: 'Something went wrong. Please try again later.'});
	});
});

router.post('/upload_files_cc_results', requireLoggedIn, function (req, res) {
	upload_cc_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		var fileId = req.signedCookies.ccFileId;
		addCCfileQueue[fileId].filesArr.push(req.files[0].path);
		res.json({});
	});
});

router.post('/clinic_consultation_edit/:cc_id/:cu_id', function (req, res) {
	var key = req.params.cc_id;
	var cu_id = req.params.cu_id;
	var date = null;

	date = req.body['date'];
	var hospital = req.body['hospital'];
	var doc = req.body['doctor'];
	
	if (req.session.doctor) {
		var summary = req.body['summary'];
		var details = req.body['detailed-diagnosis'];
		var notes = req.body['notes'];

		Consultation.update({
			date: date,
			sum_of_diag: summary,
			detailed_diag: details,
			notes: notes,
		},{
			where:{
				id: key,
			}
		}).then(updated_consultation => {
			Check_Up.update({
				hospitalName: hospital,
				doctorId: doc,
			}, {
				where: {
					id: cu_id,
				}
			}).then(updated_check_up => {
				res.json({success: true});
			}).catch(function (error) {
				console.log(error);
				res.json({error: error});
			});
		}).catch(function (error) {
			console.log(error);
			res.json({error: error});
		});
	} else if (req.session.secretary) {
		Consultation.update({
			date: date
		},{
			where:{
				id: key,
			}
		}).then(updated_consultation => {
			Check_Up.update({
				hospitalName: hospital,
				doctorId: doc,
			}, {
				where: {
					id: cu_id,
				}
			}).then(updated_check_up => {
				res.json({success: true});
			}).catch(function (error) {
				console.log(error);
				res.json({error: error});
			});
		}).catch(function (error) {
			console.log(error);
			res.json({error: error});
		});
	}
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

module.exports = router;