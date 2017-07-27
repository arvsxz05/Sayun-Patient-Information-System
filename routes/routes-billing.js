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

router.get('/billing_list/:patient_id', requireLoggedIn, function(req, res){
	var key = req.params.patient_id;
	var allRecords = [];

	if(req.session.doctor){
		InPatient_Treatment.findAll({
			where: {
				active: true
			},
			attributes: ['id', ['conf_date', 'date']],
			raw: true,
			include: [{
				model: Check_Up,
				as: 'parent_record',
				required: true,
				where: {
					active: true,
					doctorId: req.session.doctor.id,
					patientId: key,
				},
				attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
				include: [{
					model: Patient,
					attributes: ['last_name', 'middle_name', 'first_name']
				}]
			}],
		}).then(ipt_list => {
			OutPatient_Treatment.findAll({
				where: {
					active: true,
				},
				attributes: ['id', 'date'],
				raw: true,
				include: [{
					model: Check_Up,
					as: 'parent_record',
					required: true,
					where: {
						active: true,
						doctorId: req.session.doctor.id,
						patientId: key,
					},
					attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
					include: [{
						model: Patient,
						attributes: ['last_name', 'middle_name', 'first_name']
					}]
				}]
			}).then(opt_list => {
				Consultation.findAll({
					attributes: ['id', 'date'],
					where: {
						active: true,
					},
					raw: true,
					include: [{
						model: Check_Up,
						as: 'parent_record',
						required: true,
						where: {
							active: true,
							doctorId: req.session.doctor.id,
							patientId: key,
						},
						attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
						include: [{
							model: Patient,
							attributes: ['last_name', 'middle_name', 'first_name']
						}]
					}],
				}).then(cc_list =>{
					allRecords = ipt_list.concat(opt_list.concat(cc_list));
					var keys = [];

					for(var i = 0; i < allRecords.length; i++){
						keys.push(allRecords[i]['parent_record.id']);
					}

					Billing_Item.findAll({
						raw: true,
						attributes: [
							[Sequelize.fn('SUM', Sequelize.col('amount')), 'sumOfColumn'],
							'checkUpId',
						],
						group: ['billing_item.checkUpId'],
						where: {
							checkUpId: keys,
						}
					}).then(billing_sum => {

						for(var i = 0; i < allRecords.length; i++){
							allRecords[i]['expense'] = 0;
							for(var j = 0; j < billing_sum.length; j++){
								if(allRecords[i]['parent_record.id'] == billing_sum[j]['checkUpId']){
									allRecords[i]['expense'] = billing_sum[j]['sumOfColumn'];
								}
							}

						}

						res.json({
							reports: allRecords,
							session: req.session,
						});
					});
				});
			});
		});
	} else{
		InPatient_Treatment.findAll({
			where: {
				active: true
			},
			attributes: ['id', ['conf_date', 'date']],
			raw: true,
			include: [{
				model: Check_Up,
				as: 'parent_record',
				required: true,
				where: {
					active: true,
					patientId: key,
				},
				attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
				include: [{
					model: Patient,
					attributes: ['last_name', 'middle_name', 'first_name']
				}]
			}],
		}).then(ipt_list => {
			OutPatient_Treatment.findAll({
				where: {
					active: true,
				},
				attributes: ['id', 'date'],
				raw: true,
				include: [{
					model: Check_Up,
					as: 'parent_record',
					required: true,
					where: {
						active: true,
						patientId: key,
					},
					attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
					include: [{
						model: Patient,
						attributes: ['last_name', 'middle_name', 'first_name']
					}]
				}]
			}).then(opt_list => {
				Consultation.findAll({
					attributes: ['id', 'date'],
					where: {
						active: true,
					},
					raw: true,
					include: [{
						model: Check_Up,
						as: 'parent_record',
						required: true,
						where: {
							active: true,
							patientId: key,
						},
						attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
						include: [{
							model: Patient,
							attributes: ['last_name', 'middle_name', 'first_name']
						}]
					}],
				}).then(cc_list =>{
					allRecords = ipt_list.concat(opt_list.concat(cc_list));
					var keys = [];

					for(var i = 0; i < allRecords.length; i++){
						keys.push(allRecords[i]['parent_record.id']);
					}

					Billing_Item.findAll({
						raw: true,
						attributes: [
							[Sequelize.fn('SUM', Sequelize.col('amount')), 'sumOfColumn'],
							'checkUpId',
						],
						group: ['billing_item.checkUpId'],
						where: {
							checkUpId: keys,
						}
					}).then(billing_sum => {
						Doctor.findAll({
							raw: true,
							attributes: ['id'],
							include: [{
								model: User_Account,
								as: 'username',
								attributes: ['first_name', 'middle_name', 'last_name'],
								where: {
									active: true,
								}
							}]
						}).then(doctors => {
							for(var i = 0; i < allRecords.length; i++){
								allRecords[i]['expense'] = 0;
								for(var j = 0; j < billing_sum.length; j++){
									if( allRecords[i]['parent_record.id'] == billing_sum[j]['checkUpId'] ){
										allRecords[i]['expense'] = billing_sum[j]['sumOfColumn'];
									}
								}
								for(var k = 0; k < doctors.length; k++){
									if( allRecords[i]['parent_record.doctorId'] == doctors[k]['id'] ){
										if(doctors[k]['username.middle_name'] != "" && doctors[k]['username.middle_name'] != undefined){
											allRecords[i]['doctorName'] = doctors[k]['username.first_name']+" "+doctors[k]['username.middle_name']+" "+doctors[k]['username.last_name'];
										} else{
											allRecords[i]['doctorName'] = doctors[k]['username.first_name']+" "+doctors[k]['username.last_name'];
										}
									}
								}
							}

							res.json({
								reports: allRecords,
								session: req.session,
							});
						});
					});
				});
			});
		});
	}
});

router.get('/financial_report_json', requireLoggedIn, function(req, res){
	var allRecords = [];

	if(req.session.doctor){
		InPatient_Treatment.findAll({
			where: {
				active: true
			},
			attributes: ['id', ['conf_date', 'date']],
			raw: true,
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
					model: Patient,
					attributes: ['last_name', 'middle_name', 'first_name']
				}]
			}],
		}).then(ipt_list => {
			OutPatient_Treatment.findAll({
				where: {
					active: true,
				},
				attributes: ['id', 'date'],
				raw: true,
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
						model: Patient,
						attributes: ['last_name', 'middle_name', 'first_name']
					}]
				}]
			}).then(opt_list => {
				Consultation.findAll({
					attributes: ['id', 'date'],
					where: {
						active: true,
					},
					raw: true,
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
							model: Patient,
							attributes: ['last_name', 'middle_name', 'first_name']
						}]
					}],
				}).then(cc_list =>{
					allRecords = ipt_list.concat(opt_list.concat(cc_list));
					var keys = [];

					for(var i = 0; i < allRecords.length; i++){
						keys.push(allRecords[i]['parent_record.id']);
					}

					Billing_Item.findAll({
						raw: true,
						attributes: [
							[Sequelize.fn('SUM', Sequelize.col('amount')), 'sumOfColumn'],
							'checkUpId',
						],
						group: ['billing_item.checkUpId'],
						where: {
							checkUpId: keys,
						}
					}).then(billing_sum => {
						for(var i = 0; i < allRecords.length; i++){
							allRecords[i]['expense'] = 0;
							for(var j = 0; j < billing_sum.length; j++){
								if(allRecords[i]['parent_record.id'] == billing_sum[j]['checkUpId']){
									allRecords[i]['expense'] = billing_sum[j]['sumOfColumn'];
								}
							}

						}

						res.json({
							reports: allRecords,
							session: req.session,
						});
					});
				});
			});
		});
	} else{
		InPatient_Treatment.findAll({
			where: {
				active: true
			},
			attributes: ['id', ['conf_date', 'date']],
			raw: true,
			include: [{
				model: Check_Up,
				as: 'parent_record',
				required: true,
				where: {
					active: true,
				},
				attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
				include: [{
					model: Patient,
					attributes: ['last_name', 'middle_name', 'first_name']
				}]
			}],
		}).then(ipt_list => {
			OutPatient_Treatment.findAll({
				where: {
					active: true,
				},
				attributes: ['id', 'date'],
				raw: true,
				include: [{
					model: Check_Up,
					as: 'parent_record',
					required: true,
					where: {
						active: true,
					},
					attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
					include: [{
						model: Patient,
						attributes: ['last_name', 'middle_name', 'first_name']
					}]
				}]
			}).then(opt_list => {
				Consultation.findAll({
					attributes: ['id', 'date'],
					where: {
						active: true,
					},
					raw: true,
					include: [{
						model: Check_Up,
						as: 'parent_record',
						required: true,
						where: {
							active: true,
						},
						attributes: ['id', 'check_up_type', 'hospitalName', 'doctorId', 'patientId' ],
						include: [{
							model: Patient,
							attributes: ['last_name', 'middle_name', 'first_name']
						}]
					}],
				}).then(cc_list =>{
					allRecords = ipt_list.concat(opt_list.concat(cc_list));
					var keys = [];

					for(var i = 0; i < allRecords.length; i++){
						keys.push(allRecords[i]['parent_record.id']);
					}

					Billing_Item.findAll({
						raw: true,
						attributes: [
							[Sequelize.fn('SUM', Sequelize.col('amount')), 'sumOfColumn'],
							'checkUpId',
						],
						group: ['billing_item.checkUpId'],
						where: {
							checkUpId: keys,
						}
					}).then(billing_sum => {
						Doctor.findAll({
							raw: true,
							attributes: ['id'],
							include: [{
								model: User_Account,
								as: 'username',
								attributes: ['first_name', 'middle_name', 'last_name'],
								where: {
									active: true,
								}
							}]
						}).then(doctors => {
							for(var i = 0; i < allRecords.length; i++){
								allRecords[i]['expense'] = 0;
								for(var j = 0; j < billing_sum.length; j++){
									if( allRecords[i]['parent_record.id'] == billing_sum[j]['checkUpId'] ){
										allRecords[i]['expense'] = billing_sum[j]['sumOfColumn'];
									}
								}
								for(var k = 0; k < doctors.length; k++){
									if( allRecords[i]['parent_record.doctorId'] == doctors[k]['id'] ){
										if(doctors[k]['username.middle_name'] != "" && doctors[k]['username.middle_name'] != undefined){
											allRecords[i]['doctorName'] = doctors[k]['username.first_name']+" "+doctors[k]['username.middle_name']+" "+doctors[k]['username.last_name'];
										} else{
											allRecords[i]['doctorName'] = doctors[k]['username.first_name']+" "+doctors[k]['username.last_name'];
										}
									}
								}
							}

							res.json({
								reports: allRecords,
								session: req.session,
							});
						});
					});
				});
			});
		});
	}
});

router.get('/financial_report', requireLoggedIn, function(req, res){
	res.render('billing/financial-report.html', {
		session: req.session,
	});
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

router.post('/billing_item_delete', requireLoggedIn, requireDoctor, function(req, res){
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