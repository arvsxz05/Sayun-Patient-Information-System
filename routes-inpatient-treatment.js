const express = require('express');
const router = express.Router();
const InPatient_Treatment = require('./models').InPatient_Treatment;

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

router.get('/ipt_edit/:id', function(req, res){

});

/////////////////////////// POST ////////////////////////////////////

router.post('/ipt_add', function(req, res){

	console.log("at inpatient treatment add");
	console.log(req.body);

	var confine = null, discharge = null;

	if(req.body['date_']['year'][0] != '' && req.body['date_']['month'][0] != '' && req.body['date_']['day'][0] != ''){
		confine = req.body["date_"]["year"][0]+"-"+req.body["date_"]["month"][0]+"-"+req.body["date_"]["day"][0];
	}

	console.log("confine: "+confine);

	if(req.body['date_']['year'][1] != '' && req.body['date_']['month'][1] != '' && req.body['date_']['day'][1] != ''){
		discharge = req.body["date_"]["year"][1]+"-"+req.body["date_"]["month"][1]+"-"+req.body["date_"]["day"][1];
	}

	console.log("discharge: "+discharge);

	var hospital = req.body['hospital'];
	var summary = req.body['summary'];
	var details = req.body['detailed-diagnosis'];
	var notes = req.body['notes'];

	InPatient_Treatment.create({
		conf_date: confine,
		discharge_date: discharge,
		sum_of_diag: summary,
		detailed_diag: details,
		notes: notes,
	}).then(function(item){
		res.send({"status": "success"});
	}).catch(function(item){
		res.send({"error": "error"})
	})


});

module.exports = router;