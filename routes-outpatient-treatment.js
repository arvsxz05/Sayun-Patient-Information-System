const express = require('express');
const router = express.Router();
const OutPatient_Treatment = require('./models').OutPatient_Treatment;

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

router.get('/outpatient_treatment_list', function(req, res){
	
});

router.get('/outpatient_treatment_add', function(req, res){

});

router.get('/outpatient_treatment_edit/:id', function(req, res){

});

module.exports = router;