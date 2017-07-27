const express = require('express');
const router = express.Router();
const InPatient_Treatment = require('../models/database').InPatient_Treatment;
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

router.get('/prescription/:checkUpId', requireLoggedIn, function (req, res, next) {
	var checkUpId = req.params.checkUpId;

	Medication.findAll({
		raw: true,
		where: {
			checkUpId: checkUpId
		}
	}).then(medication_list => {
		if(medication_list && medication_list.length != 0) {
			InPatient_Treatment.findOne({
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
			}).then(ipt_instance => {
				if (ipt_instance) {
					var html = nunjucks.render('reports/samplereport.html', {
						medication_list: medication_list,
						ipt_instance: ipt_instance
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
		} else {
			res.send("No Medication to prescribe!");
		}
	}).catch(error => {
		console.log(error);
		res.json({error: error});
	});
});

module.exports = router;