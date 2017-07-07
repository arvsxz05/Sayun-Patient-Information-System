const express = require('express');
const router = express.Router();
const Laboratory = require('./models').Laboratory;
const Hospital = require('./models').Hospital;

const multer = require('multer');

var fileQueue = {};

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

const upload = multer({
	storage: multer.diskStorage({
		destination: function (req, file, cb) {
			if(file.fieldname == 'attachments[]'){
				var path = './uploads/lab_results';
				cb(null, path);
			}
		},
		filename: function (req, file, cb) {

			// require('crypto').pseudoRandomBytes(16, function (err, raw) {
			// 	if (req.fileValidationError){
			// 		return cb(err);
			// 	}

				cb(null, Date.now()+file.originalname);//'.'+require('mime').extension(file.mimetype));
			// });
		}
	}),
});

var upload_success = upload.array('attachments[]');

//////////////////////// GET ////////////////////////////////////

router.get('/laboratory_list', requireLoggedIn, function (req, res) {
	Laboratory.findAll({raw: true}).then(result => {
		res.render('treatments/lab-results-list.html', {results: result});
	});
});

router.get('/laboratory_add', requireLoggedIn,
	function (req, res, next) {
		var fileId = Date.now() + "" + Math.floor(Math.random()*10);
		res.cookie('fileId', fileId, { signed: true });
		fileQueue[fileId] = {filesArr: []};
		next();
	},
	function (req, res) {
		Hospital.findAll({ where: {
			active: true, 
			spisInstanceLicenseNo: req.session.spisinstance.license_no
		}, raw: true }).then (hospitals => {
			res.render('treatments/add-lab-results.html', {
				hospitals: hospitals
			});
		});
	}
);

router.get('/laboratory_edit/:id', requireLoggedIn, function(req, res){

});

router.post('/laboratory_add', requireLoggedIn, upload.array('attachments[]'), function (req, res) {
	var fileId = req.signedCookies.fileId;
	if (req.body.notes.trim() === "") { req.body.notes = null; }
	Laboratory.create({
		date: req.body.date,
		description: req.body.description,
		hospital: req.body.hospital,
		notes: req.body.notes,
		attachments: fileQueue[fileId].filesArr
	}).then(lab_instance => {
		fileQueue[fileId] = {};
		res.redirect('/laboratory_add');
	});
});

router.post('/upload_files_lab_results', requireLoggedIn, function (req, res) {
	upload_success (req, res, function (err) {
		if (err) {
			return res.json({error: "Your upload failed. Please try again later."});
		}
		var fileId = req.signedCookies.fileId;
		fileQueue[fileId].filesArr.push(req.files[0].path);
		res.json({});
	});
});

module.exports = router;