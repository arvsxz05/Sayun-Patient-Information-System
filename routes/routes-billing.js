const express = require('express');
const router = new express.Router();
const Check_Up = require('../models/database').Check_Up;
const Medication = require('../models/database').Medication;
const Medical_Procedure = require('../models/database').Medical_Procedure;
const Billing_Item = require('../models/database').Billing_Item;
const InPatient_Treatment = require('../models/database').InPatient_Treatment;
const OutPatient_Treatment = require('../models/database').OutPatient_Treatment;
const Consultation = require('../models/database').Consultation;
const User_Account = require('../models/database').User_Account;
const Doctor = require('../models/database').Doctor;
const Patient = require('../models/database').Patient;
const Sequelize = require('sequelize');

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

router.get('/billing_list/:patient_id', requireLoggedIn, function(req, res) {
	var key = req.params.patient_id;
	var allRecords = [];
	var checkup_where_option, include_option;

	if(req.session.doctor) {
		checkup_where_option = {
			active: true,
			doctorId: req.session.doctor.id,
			patientId: key,
		};
	} else if (req.session.secretary) {
		checkup_where_option = {
			active: true,
			patientId: key,
		};
	}

	include_option = [{
		model: Check_Up,
		as: 'parent_record',
		attributes: [],
		required: true,
		where: checkup_where_option,
		include: [{
			model: Billing_Item,
			as: 'billing_items',
			attributes: [],
			required: true,
		}, {
			model: Doctor,
			attributes: [],
			include: [{
				model: User_Account,
				as: 'username',
				attributes: ['first_name', 'middle_name', 'last_name', 'suffix']
			}]
		}]
	}];

	InPatient_Treatment.findAll({
		attributes: [
			'id', 
			['conf_date', 'date'], 
			'parent_record.check_up_type', 
			'parent_record.hospitalName', 
			'parent_record.doctorId', 
			'parent_record.patientId', 
			'parent_record->billing_items.checkUpId',
			[Sequelize.fn('SUM', Sequelize.col('parent_record->billing_items.amount')), 'sumOfColumn']
		],
		where: {
			active: true
		},
		group: [
			"parent_record->billing_items.checkUpId", 
			"inpatient_treatment.id", 
			"parent_record.check_up_type", 
			"parent_record.hospitalName", 
			"parent_record.doctorId", 
			"parent_record.patientId",
			"parent_record->doctor->username.id"
		],
		raw: true,
		include: include_option
	}).then(ipt_list => {
		OutPatient_Treatment.findAll({
			attributes: [
				'id', 
				'date', 
				'parent_record.check_up_type', 
				'parent_record.hospitalName', 
				'parent_record.doctorId', 
				'parent_record.patientId', 
				'parent_record->billing_items.checkUpId',
				[Sequelize.fn('SUM', Sequelize.col('parent_record->billing_items.amount')), 'sumOfColumn']
			],
			where: {
				active: true
			},
			group: [
				"parent_record->billing_items.checkUpId", 
				"outpatient_treatment.id", 
				"parent_record.check_up_type", 
				"parent_record.hospitalName", 
				"parent_record.doctorId", 
				"parent_record.patientId",
				"parent_record->doctor->username.id"
			],
			raw: true,
			include: include_option
		}).then(opt_list => {
			Consultation.findAll({
				attributes: [
					'id', 
					'date', 
					'parent_record.check_up_type', 
					'parent_record.hospitalName', 
					'parent_record.doctorId', 
					'parent_record.patientId',
					'parent_record->billing_items.checkUpId',
					[Sequelize.fn('SUM', Sequelize.col('parent_record->billing_items.amount')), 'sumOfColumn']
				],
				where: {
					active: true
				},
				group: [
					"parent_record->billing_items.checkUpId", 
					"consultation.id", 
					"parent_record.check_up_type", 
					"parent_record.hospitalName", 
					"parent_record.doctorId", 
					"parent_record.patientId",
					"parent_record->doctor->username.id"
				],
				raw: true,
				include: include_option
			}).then(cc_list => {
				allRecords = ipt_list.concat(opt_list.concat(cc_list));
				res.json({
					reports: allRecords,
					session: req.session
				});
			});
		});
	});
});

router.get('/financial_report', requireLoggedIn, function(req, res){
	var allRecords = [];
	var checkup_where_option, include_option;

	if(req.session.doctor) {
		checkup_where_option = {
			active: true,
			doctorId: req.session.doctor.id
		};
	} else if (req.session.secretary) {
		checkup_where_option = {
			active: true
		};
	}

	include_option = [{
		model: Check_Up,
		as: 'parent_record',
		attributes: [],
		required: true,
		where: checkup_where_option,
		include: [{
			model: Billing_Item,
			as: 'billing_items',
			attributes: [],
			required: true
		}, {
			model: Doctor,
			attributes: [],
			include: [{
				model: User_Account,
				as: 'username',
				attributes: ['first_name', 'middle_name', 'last_name', 'suffix']
			}]
		}, {
			model: Patient,
			attributes: ['last_name', 'middle_name', 'first_name']
		}]
	}];

	InPatient_Treatment.findAll({
		attributes: [
			'id', 
			['conf_date', 'date'], 
			'parent_record.check_up_type', 
			'parent_record.hospitalName', 
			'parent_record.doctorId', 
			'parent_record.patientId', 
			'parent_record->billing_items.checkUpId',
			[Sequelize.fn('SUM', Sequelize.col('parent_record->billing_items.amount')), 'sumOfColumn']
		],
		where: {
			active: true
		},
		group: [
			"parent_record->billing_items.checkUpId", 
			"inpatient_treatment.id", 
			"parent_record.check_up_type", 
			"parent_record.hospitalName", 
			"parent_record.doctorId", 
			"parent_record.patientId",
			"parent_record->doctor->username.id",
			"parent_record->patient.id"
		],
		raw: true,
		include: include_option
	}).then(ipt_list => {
		OutPatient_Treatment.findAll({
			attributes: [
				'id', 
				'date', 
				'parent_record.check_up_type', 
				'parent_record.hospitalName', 
				'parent_record.doctorId', 
				'parent_record.patientId', 
				'parent_record->billing_items.checkUpId',
				[Sequelize.fn('SUM', Sequelize.col('parent_record->billing_items.amount')), 'sumOfColumn']
			],
			where: {
				active: true
			},
			group: [
				"parent_record->billing_items.checkUpId", 
				"outpatient_treatment.id", 
				"parent_record.check_up_type", 
				"parent_record.hospitalName", 
				"parent_record.doctorId", 
				"parent_record.patientId",
				"parent_record->doctor->username.id",
				"parent_record->patient.id"
			],
			raw: true,
			include: include_option
		}).then(opt_list => {
			Consultation.findAll({
				attributes: [
					'id', 
					'date', 
					'parent_record.check_up_type', 
					'parent_record.hospitalName', 
					'parent_record.doctorId', 
					'parent_record.patientId',
					'parent_record->billing_items.checkUpId',
					[Sequelize.fn('SUM', Sequelize.col('parent_record->billing_items.amount')), 'sumOfColumn']
				],
				where: {
					active: true
				},
				group: [
					"parent_record->billing_items.checkUpId", 
					"consultation.id", 
					"parent_record.check_up_type", 
					"parent_record.hospitalName", 
					"parent_record.doctorId", 
					"parent_record.patientId",
					"parent_record->doctor->username.id",
					"parent_record->patient.id"
				],
				raw: true,
				include: include_option
			}).then(cc_list => {
				allRecords = ipt_list.concat(opt_list.concat(cc_list));
				res.render('billing/financial-report.html', {
					reports: allRecords,
					session: req.session
				});
			});
		});
	});
});


/////////////////////////// POST //////////////////////////////

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
	}, {
		raw: true,
	}).then(function(billing_item_instance){
		if(billing_item_instance){
			res.send({
				billing_item_id: billing_item_instance.id
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
	var key = req.params.billing_item_id;

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

router.post('/billing_item_delete', requireLoggedIn, requireDoctor, function (req, res) {
	var key = req.body['billing_items'];
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