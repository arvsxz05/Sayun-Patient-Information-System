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

///////////////////////////GET//////////////////////////////

router.get('/billing_list/:check_up_id', requireLoggedIn, function(req, res){
	var key = req.params.check_up_id;

	if(req.session.doctor){
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
					model: Billing_Item,
					as: 'billing_items',
					required: true,
				}]
			}],
		}).then(ipt_list => {
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
						model: Billing_Item,
						as: 'billing_items',
						required: true,
					}]
				}]
			}).then(opt_list => {
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
							model: Billing_Item,
							as: 'billing_items',
							required: true,
						}]
					}],
				}).then(cc_list =>{
					console.log(ipt_list.concat(opt_list.concat(cc_list)));
					res.json({
						meds: ipt_list.concat(opt_list.concat(cc_list)),
					});
				});
			});
		});
	} else{
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
				},
				attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
				include: [{
					model: Billing_Item,
					as: 'billing_items',
					required: true,
				}]
			}],
		}).then(ipt_list => {
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
					},
					attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
					include: [{
						model: Billing_Item,
						as: 'billing_items',
						required: true,
					}]
				}]
			}).then(opt_list => {
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
						},
						attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
						include: [{
							model: Billing_Item,
							as: 'billing_items',
							required: true,
						}]
					}],
				}).then(cc_list =>{
					console.log(ipt_list.concat(opt_list.concat(cc_list)));
					res.json({
						meds: ipt_list.concat(opt_list.concat(cc_list)),
					});
				});
			});
		});
	}
});

router.get('/financial_report', requireLoggedIn, function(req, res){
	var key = req.params.check_up_id;

	if(req.session.doctor){
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
					active: true,
					doctorId: req.session.doctor.id,
				},
				attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
				include: [{
					model: Billing_Item,
					as: 'billing_items',
					required: true,
				}]
			}],
		}).then(ipt_list => {
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
						active: true,
						doctorId: req.session.doctor.id,
					},
					attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
					include: [{
						model: Billing_Item,
						as: 'billing_items',
						required: true,
					}]
				}]
			}).then(opt_list => {
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
							active: true,
							doctorId: req.session.doctor.id,
						},
						attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
						include: [{
							model: Billing_Item,
							as: 'billing_items',
							required: true,
						}]
					}],
				}).then(cc_list =>{
					console.log(ipt_list.concat(opt_list.concat(cc_list)));
					res.json({
						meds: ipt_list.concat(opt_list.concat(cc_list)),
					});
				});
			});
		});
	} else{
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
					active: true,
				},
				attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
				include: [{
					model: Billing_Item,
					as: 'billing_items',
					required: true,
				}]
			}],
		}).then(ipt_list => {
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
						active: true,
					},
					attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
					include: [{
						model: Billing_Item,
						as: 'billing_items',
						required: true,
					}]
				}]
			}).then(opt_list => {
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
							active: true,
						},
						attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
						include: [{
							model: Billing_Item,
							as: 'billing_items',
							required: true,
						}]
					}],
				}).then(cc_list =>{
					console.log(ipt_list.concat(opt_list.concat(cc_list)));
					res.json({
						meds: ipt_list.concat(opt_list.concat(cc_list)),
					});
				});
			});
		});
	}
});


///////////////////////////POST//////////////////////////////

router.post('/billing_item_add_check_up/:check_up_id', requireLoggedIn, requireDoctor, function(req, res){
	var key = req.params.check_up_id;

	console.log("IN BILLING ITEM ADD");
	console.log(req.body);

	var desc = req.body['description'];
	var amount = req.body['amount'];

	if(amount != "" && amount != undefined){
		amount = parseInt(amount);
	} else{
		amount = 0;
	}

	Billing_Item.create({
		description: desc,
		amount: amount,
		checkUpId: key,
		last_edited: req.session.user.id,
		issued_by: req.session.user.id,
	}).then(function(billing_item_instance){
		if(billing_item_instance){
			res.send({
				success: true
			});
		} else{
			res.send({
				success: false
			});
		}
	});
});

router.post('/billing_item_add_laboratory/:lab_id', requireLoggedIn, requireDoctor, function(req, res){
	var key = req.params.lab_id;

	console.log("IN BILLING ITEM ADD");
	console.log(req.body);

	var desc = req.body['description'];
	var amount = req.body['amount'];

	if(amount != "" && amount != undefined){
		amount = parseInt(amount);
	} else{
		amount = 0;
	}

	Billing_Item.create({
		description: desc,
		amount: amount,
		laboratoryId: key,
		last_edited: req.session.user.id,
		issued_by: req.session.user.id,
	}).then(function(billing_item_instance){
		if(billing_item_instance){
			res.send({
				success: true
			});
		} else{
			res.send({
				success: false
			});
		}
	});
});


router.post('/billing_item_edit/:billing_item_id', requireLoggedIn, function(req, res){
	var key = billing_item_id;

	var description = req.body['description'];
	var amount = req.body['amount'];

	if(amount != "" && amount != undefined){
		amount = parseInt(amount);
	} else{
		amount = 0;
	}

	Billing_Item.update({
		description: description,
		amount: amount,
		last_edited: req.session.user.id,
	}, {
		where: {
			id: key
		}
	}).then(function(updated_billing_item){
		res.json({
			success: true
		});
	});

});

router.post('/billing_item_delete/:billing_item_id', requireLoggedIn, requireDoctor, function(req, res){
	var key = req.params.billing_item_id;
	Billing_Item.destroy({
		where: {
			id: key
		},
		returning: true,
		raw: true,
	}).then(function(destroyed_billing_item){
		if(destroyed_billing_item){
			res.send({
				success: true
			})
		} else{
			res.send({
				success: false
			})
		}
	});
});

module.exports = router;