const express = require('express');
const router = express.Router();
const Laboratory = require('./models').Laboratory;
const Hospital = require('./models').Hospital;

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
		// return res.redirect('/login');
		return res.send("You are not authorized to access this page");
	}
	next();
}



//////////////////////// GET ////////////////////////////////////

router.get('/laboratory_list', requireLoggedIn, function (req, res) {
	Laboratory.findAll({raw: true}).then(result => {
		res.render('treatments/lab-results-list.html', {results: result});
	});
});

// router.get('/laboratory_add', requireLoggedIn,
// 	function (req, res, next) {
// 		var fileId = Date.now() + "" + Math.floor(Math.random()*10);
// 		res.cookie('fileId', fileId, { signed: true });
// 		fileQueue[fileId] = {filesArr: []};
// 		next();
// 	},
// 	function (req, res) {
// 		Hospital.findAll({ where: {
// 			active: true, 
// 			spisInstanceLicenseNo: req.session.spisinstance.license_no
// 		}, raw: true }).then (hospitals => {
// 			res.render('treatments/add-lab-results.html', {
// 				hospitals: hospitals
// 			});
// 		});
// 	}
// );

router.get('/laboratory_edit/:id', requireLoggedIn, function(req, res){

});


module.exports = router;