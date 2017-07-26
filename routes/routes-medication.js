const express = require('express');
const router = new express.Router();
const Check_Up = require('../models/database').Check_Up;
const Medication = require('../models/database').Medication;
const Medical_Procedure = require('../models/database').Medical_Procedure;
const Billing_Item = require('../models/database').Billing_Item;
const InPatient_Treatment = require('../models/database').InPatient_Treatment;
const OutPatient_Treatment = require('../models/database').OutPatient_Treatment;
const Consultation = require('../models/database').Consultation;


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

/////////////////////// GET //////////////////////////

router.get('/patient_medication_list/:patient_id', requireLoggedIn, requireDoctor, function(req, res) {

	var key = req.params.patient_id;
	var currResult;

	InPatient_Treatment.findAll({
		raw: true,
		where: {
			active: true
		},
		attributes: ['id', 'conf_date'],
		include: [{
			model: Check_Up,
			as: 'parent_record',
			required: true,
			where: {
				patientId: key,
				active: true,
				doctorId: req.session.doctor.id,
			},
			attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
			include: [{
				model: Medication,
				as: 'medication',
				required: true,
				where: {
					type: "Maintenance",
				}
			}]
		}],
	}).then(function(ipts){
		OutPatient_Treatment.findAll({
			raw: true,
			where: {
				active: true,
			},
			attributes: ['id', 'date'],
			include: [{
				model: Check_Up,
				as: 'parent_record',
				required: true,
				where: {
					patientId: key,
					active: true,
					doctorId: req.session.doctor.id,
				},
				attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
				include: [{
					model: Medication,
					as: 'medication',
					required: true,
					where: {
						type: "Maintenance",
					}
				}]
			}]
		}).then(function(opts){
			Consultation.findAll({
				raw: true,
				attributes: ['id', 'date'],
				where: {
					active: true,
				},
				include: [{
					model: Check_Up,
					as: 'parent_record',
					required: true,
					where: {
						patientId: key,
						active: true,
						doctorId: req.session.doctor.id,
					},
					attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
					include: [{
						model: Medication,
						as: 'medication',
						required: true,
						where: {
							type: "Maintenance",
						}
					}]
				}],
			}).then(function(ccs){
				res.json({
					meds: ipts.concat(opts.concat(ccs)),
				})

			});
		});
	});
});

/////////////////////// POST //////////////////////////

// IPT MEDICAL AND MEDICAL PROCEDURE
router.post("/ipt_edit_add_medication/:cu_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.cu_id;

	console.log("IN HERE CALLED ADD MEDICATION");

	Medication.create({
		name: req.body['name'],
		dosage: req.body['dosage'],
		frequency: req.body['frequency'],
		type: req.body['type'],
		notes: req.body['notes'],
		checkUpId: key
	}, {
		raw: true
	}).then(med_instance => {
		Billing_Item.create({
			description: req.body['name'].trim(),
			receiptId: med_instance['id'],
			checkUpId: med_instance['checkUpId'],
			last_edited: req.session.user.id,
			issued_by: req.session.user.id,
			type: "Medication",
		}, {
			raw: true
		}).then(billing_item => {
			res.json({
				medication_id: med_instance.id,
				billing_item_id: billing_item.id
			});
		});
	});
});

router.post("/ipt_edit_add_medical_procedure/:cu_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.cu_id;
	Medical_Procedure.create({
		date: req.body['date'],
		description: req.body['description'],
		details: req.body['details'],
		checkUpId: key,
	}, {
		raw: true
	}).then(procedure_instance => {
		Billing_Item.create({
			description: req.body['description'].trim(),
			receiptId: procedure_instance['id'],
			checkUpId: procedure_instance['checkUpId'],
			last_edited: req.session.user.id,
			issued_by: req.session.user.id,
			type: "Medical Procedure",
		}, {
			raw: true
		}).then(billing_item => {
			res.json({
				medical_procedure_id: procedure_instance.id,
				billing_item_id: billing_item.id,
			});
		});
	});
});
//END OF IPT

// OPT MEDICATION AND MEDICAL PROCEDURE
router.post("/opt_edit_add_medication/:cu_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.cu_id;
	Medication.create({
		name: req.body['name'].trim(),
		dosage: req.body['dosage'].trim(),
		frequency: req.body['frequency'].trim(),
		type: req.body['type'],
		notes: req.body['notes'].trim(),
		checkUpId: key,
	}, {
		raw: true
	}).then(med_instance => {
		Billing_Item.create({
			description: req.body['name'].trim(),
			receiptId: med_instance['id'],
			checkUpId: med_instance['checkUpId'],
			last_edited: req.session.user.id,
			issued_by: req.session.user.id,
			type: "Medication",
		}, {
			raw: true
		}).then(billing_item => {
			res.json({
				medication_id: med_instance.id,
				billing_item_id: billing_item.id,
			});
		});
	});
});

router.post("/opt_edit_add_medical_procedure/:cu_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.cu_id;
	Medical_Procedure.create({
		date: req.body['date'],
		description: req.body['description'].trim(),
		details: req.body['details'].trim(),
		checkUpId: key,
	}, {
		raw: true
	}).then(procedure_instance => {
		Billing_Item.create({
			description: req.body['description'].trim(),
			receiptId: procedure_instance['id'],
			checkUpId: procedure_instance['checkUpId'],
			last_edited: req.session.user.id,
			issued_by: req.session.user.id,
			type: "Medical Procedure",
		}, {
			raw: true
		}).then(billing_item => {
			res.json({
				medical_procedure_id: procedure_instance.id,
				billing_item_id: billing_item.id,
			});
		});
	});
});
// END OF OPT

//CC MEDICATION AND MEDICAL PROCEDURE
router.post("/clinic_consultation_edit_add_medication/:cu_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.cu_id;

	Medication.create({
		name: req.body['name'],
		dosage: req.body['dosage'],
		frequency: req.body['frequency'],
		type: req.body['type'],
		notes: req.body['notes'],
		checkUpId: key
	}, {
		raw: true,
	}).then(med_instance => {
		Billing_Item.create({
			description: req.body['name'].trim(),
			receiptId: med_instance['id'],
			checkUpId: med_instance['checkUpId'],
			last_edited: req.session.user.id,
			issued_by: req.session.user.id,
			type: "Medication",
		}, {
			raw: true,
		}).then(billing_item => {
			res.json({
				medication_id: med_instance.id,
				billing_item_id: billing_item.id,
			});
		});
	});
});

router.post("/clinic_consultation_edit_add_medical_procedure/:cu_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.cu_id;

	Medical_Procedure.create({
		date: req.body['date'],
		description: req.body['description'],
		details: req.body['details'],
		checkUpId: key,
	}, {
		raw: true,
	}).then(procedure_instance => {
		Billing_Item.create({
			description: req.body['description'].trim(),
			receiptId: procedure_instance['id'],
			checkUpId: procedure_instance['checkUpId'],
			last_edited: req.session.user.id,
			issued_by: req.session.user.id,
			type: "Medical Procedure",
		}, {
			raw: true,
		}).then(billing_item => {
			res.json({
				medical_procedure_id: procedure_instance.id,
				billing_item_id: billing_item.id,
			});
		});
	});
});
// END OF CC

router.post("/edit_medication/:med_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.med_id;
	var name = req.body['name'].trim();

	Medication.findOne({
		where: {
			id: key
		},
		raw: true,
	}).then(med_instance => {
		Medication.update({
			name: name,
			dosage: req.body['dosage'].trim(),
			frequency: req.body['frequency'].trim(),
			type: req.body['type'],
			notes: req.body['notes'].trim()
		}, {
			where: {
				id: key,
			},
			returning: true,
			raw: true,
		}).then(updated_med_instance => {
			console.log(updated_med_instance);
			console.log(updated_med_instance[1][0]['name']);
			if(med_instance['name'] != updated_med_instance[1][0]['name']){
				Billing_Item.update({
					description: name,
					last_edited: req.session.user.id,
				}, {
					where: {
						checkUpId: med_instance['checkUpId'],
						receiptId: med_instance['id'],
						description: med_instance['name']
					}
				}).then(billing_item => {
					res.json({id: med_instance.id});
				});
			} else{
				res.json({id: med_instance.id});
			}
		});
	});
});

router.post("/edit_medical_procedure/:medproc_id", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.params.medproc_id;
	var desc = req.body['description'].trim();
	Medical_Procedure.findOne({
		where: {
			id: key
		},
		raw: true
	}).then(procedure_instance => {
		Medical_Procedure.update({
			date: req.body['date'],
			description: req.body['description'].trim(),
			details: req.body['details'].trim(),
		}, {
			where: {
				id: key
			}
		}).then(updated_procedure_instance => {
			if(procedure_instance['description'] != updated_procedure_instance['description']){
				Billing_Item.update({
					description: desc,
					last_edited: req.session.user.id,
				}, {
					where: {
						checkUpId: procedure_instance['checkUpId'],
						receiptId: procedure_instance['id'],
						description: procedure_instance['description'],
					}
				}).then(billing_item => {
					res.json({id: procedure_instance.id});
				});
			} else{
				res.json({id: procedure_instance.id});
			}
		});
	});
});

router.post("/medication_delete", requireLoggedIn, requireDoctor, function (req, res) {

	var key = req.body['medication'];
	var desc = [];
	
	Medication.findAll({
		where: {
			id: key
		},
		raw: true
	}).then(medication_instance =>{
		for(var i = 0; i < medication_instance.length; i++){
			desc.push(medication_instance[i].name);
		}
		Medication.destroy({
			where: {
				id: key
			}
		}).then(function(deleted_medication){
			Billing_Item.destroy({
				where: {
					receiptId: key,
					checkUpId: medication_instance[0].checkUpId,
					description: desc,
				},
			}).then(function(deleted_billing){
				res.json({
					success: true
				});
			});
		});
	});
});

router.post("/medical_procedure_delete", requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.body['medical_procedure'];
	var desc = [];
	Medical_Procedure.findAll({
		where: {
			id: key
		},
		raw: true
	}).then(medical_procedure => {
		for(var i = 0; i < medical_procedure.length; i++){
			desc.push(medical_procedure[i].description);
		}
		Medical_Procedure.destroy({
			where: {
				id: key
			}
		}).then(function(deleted_medical_procedure){
			Billing_Item.destroy({
				where: {
					receiptId: key,
					checkUpId: medical_procedure[0]['checkUpId'],
					description: desc,
				}
			}).then(function(deleted_billing){
				if(deleted_billing){
					res.json({
						success: true
					});
				} else{
					res.json({
						success: false
					});
				}
			});
		});
	});
});

module.exports = router;