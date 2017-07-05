const express = require('express');
const router = express.Router();
const Laboratory = require('./models').Laboratory;
const multer = require('multer');

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

var upload = multer({ dest: './uploads/lab_results' })

//////////////////////// GET ////////////////////////////////////

router.get('/laboratory_list', function (req, res) {
	
});

router.get('/laboratory_add', function (req, res) {
	res.render('treatments/add-lab-results.html');
});

router.get('/laboratory_edit/:id', function(req, res){

});

router.post('/laboratory_add', upload.array('attachments[]'), function (req, res) {
	console.log(req.body);
	console.log(req.files);
	res.redirect('/laboratory_add');
});

module.exports = router;