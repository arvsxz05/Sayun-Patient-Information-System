const express = require('express');
const router = new express.Router();
const Check_Up = require('./models').Check_Up;
const Medication = require('./models').Medication;
const Medical_Procedure = require('./models').Medical_Procedure;
const Billing_Item = require('./models').Billing_Item;
const InPatient_Treatment = require('./models').InPatient_Treatment;
const OutPatient_Treatment = require('./models').OutPatient_Treatment;
const Consultation = require('./models').Consultation;

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

	Billing.findOne({
		where: {
			receiptId: key
		},
		raw: true
	}).then(function(billing_instance){
		Billing_Item.findAll({
			where: {
				billingId: billing_instance['id']
			},
			raw: true
		}).then(function(billing_items_list){
			console.log("IN BILLING ITEMS LIST");
			res.json({
				billing_items: billing_items_list
			})
		});
	})
});

///////////////////////////POST//////////////////////////////

router.post('/billing_item_add/:billing_id', requireLoggedIn, requireDoctor, function(req, res){
	var key = req.params.billing_id;

	console.log("IN BILLING ITEM ADD");
	console.log(req.body);

	var desc = req.body['description'];
	var amount = req.body['amount'];

	if(amount != "" && amount != undefined){
		amount = parseInt(amount);
	}

	Billing_Item.create({
		description: desc,
		amount: amount,
		billingId: key,
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
	if(req.session.doctor){

		var description = req.body['description'];
		var amount = req.body['amount'];

		Billing_Item.update({
			description: description,
			amount: amount,
		}, {
			where: {
				id: key
			}
		}).then(function(updated_billing_item){
			res.json({
				success: true
			});
		});

	} else{

		var amount = req.body['amount'];

		Billing_Item.update({
			amount: amount
		}, {
			where: {
				id: key
			}
		}).then(function(updated_billing_item){
			res.json({
				success: true
			});
		});
	}
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