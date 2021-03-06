const express = require('express');
const router = express.Router();
const InPatient_Treatment = require('../models/database').InPatient_Treatment;
const OutPatient_Treatment = require('../models/database').OutPatient_Treatment;
const Consultation = require('../models/database').Consultation;
const Check_Up = require('../models/database').Check_Up;
const Medication = require('../models/database').Medication;
const Hospital = require('../models/database').Hospital;
const fs = require('fs');
const pdf = require('html-pdf');
const nunjucks = require('nunjucks');

///////////////////// MIDDLEWARES ////////////////////////

function requireLoggedIn(req, res, next) {
	const currentInstance = req.session.spisinstance;
	const currentUser = req.session.user;
	if(!currentUser || !currentInstance) {
		return res.redirect('/login');
	}
	next();
}

/////////////////////////// GET ////////////////////////////////////

router.get('/prescription/:checkUpId/:mode', requireLoggedIn, function (req, res) {
	// console.log(req.query.note);
	var checkUpId = req.params.checkUpId;
	var mode = req.params.mode;

	if (mode !== 'ipt' && mode !== 'opt' && mode !== 'con') {
		res.send('Invalid request!');
	}

	Medication.findAll({
		raw: true,
		where: {
			checkUpId: checkUpId
		}
	}).then(medication_list => {
		if(medication_list && medication_list.length != 0) {
			if (mode === 'ipt') {
				InPatient_Treatment.findOne({
					raw: true,
					where: {
						parentRecordId: checkUpId
					},
					attributes: ['id', ['conf_date', 'date'], 'discharge_date'],
					include: [{
						model: Check_Up,
						required: true,
						as: 'parent_record',
						include: [{
							model: Hospital,
							required: true,
							where: {
								spisInstanceLicenseNo: req.session.spisinstance.license_no,
								active: true
							}
						}]
					}]
				}).then(ipt_instance => {
					if (ipt_instance) {
						var html = nunjucks.render('reports/samplereport.html', {
							medication_list: medication_list,
							ipt_instance: ipt_instance,
							note: req.query.note
						});
						var options = { 
							format: 'Letter',
							base: 'http://' + req.headers.host + '/'
						};

						pdf.create(html, options).toFile('./generated_prescriptions/prescription_' + checkUpId + '.pdf', function(err, resDoc) {
							if (err) return console.log(err);
							var file = resDoc.filename;
					        fs.readFile(file, function (err,data) {
					            res.contentType("application/pdf");
					            res.send(data);
					        });
						});
					} else {
						res.send("You don't have access to this.");
					}
				});
			} else if (mode === 'opt') {
				OutPatient_Treatment.findOne({
					raw: true,
					where: {
						parentRecordId: checkUpId
					},
					include: [{
						model: Check_Up,
						required: true,
						as: 'parent_record',
						include: [{
							model: Hospital,
							required: true,
							where: {
								spisInstanceLicenseNo: req.session.spisinstance.license_no,
								active: true
							}
						}]
					}]
				}).then(opt_instance => {
					if (opt_instance) {
						var html = nunjucks.render('reports/samplereport.html', {
							medication_list: medication_list,
							ipt_instance: opt_instance,
							note: req.query.note
						});
						var options = { 
							format: 'Letter',
							base: 'http://' + req.headers.host + '/'
						};

						pdf.create(html, options).toFile('./generated_prescriptions/prescription_' + checkUpId + '.pdf', function(err, resDoc) {
							if (err) return console.log(err);
							var file = resDoc.filename;
					        fs.readFile(file, function (err,data) {
					            res.contentType("application/pdf");
					            res.send(data);
					        });
						});
					} else {
						res.send("You don't have access to this.");
					}
				});
			} else if (mode === 'con') {
				Consultation.findOne({
					raw: true,
					where: {
						parentRecordId: checkUpId
					},
					include: [{
						model: Check_Up,
						required: true,
						as: 'parent_record',
						include: [{
							model: Hospital,
							required: true,
							where: {
								spisInstanceLicenseNo: req.session.spisinstance.license_no,
								active: true
							}
						}]
					}]
				}).then(consultation_instance => {
					if (consultation_instance) {
						var html = nunjucks.render('reports/samplereport.html', {
							medication_list: medication_list,
							ipt_instance: consultation_instance,
							note: req.query.note
						});
						var options = { 
							format: 'Letter',
							base: 'http://' + req.headers.host + '/'
						};

						pdf.create(html, options).toFile('./generated_prescriptions/prescription_' + checkUpId + '.pdf', function(err, resDoc) {
							if (err) return console.log(err);
							var file = resDoc.filename;
					        fs.readFile(file, function (err,data) {
					            res.contentType("application/pdf");
					            res.send(data);
					        });
						});
					} else {
						res.send("You don't have access to this.");
					}
				});
			}
			
		} else {
			res.send("No Medication to prescribe!");
		}
	}).catch(error => {
		console.log(error);
		res.json({error: error});
	});
});

module.exports = router;