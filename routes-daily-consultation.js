const express = require('express');
const router = express.Router();
const Consultation = require('./models').Consultation;
const Check_Up = require('./models').Check_Up;
const Hospital = require('./models').Hospital;
const Doctor = require('./models').Doctor;
const Secretary = require('./models').Secretary;
const Patient = require('./models').Patient;
const User_Account = require('./models').User_Account;

//////////////////////////// MIDDLEWARES /////////////////////////////////

function requireLoggedIn(req, res, next) {
	const currentInstance = req.session.spisinstance;
	const currentUser = req.session.user;
	if(!currentUser || !currentInstance) {
		return res.redirect('/login');
	}
	next();
}

function requireSecretary(req, res, next) {
	const currentUser = req.session.secretary;
	if(!currentUser) {
		return res.send("You are not authorized to access this page");
	}
	next();
}

function formatDate(date) {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
}

/////////////////////////////// GET ////////////////////////////////////

router.get('/daily_consultation_list/:date', requireLoggedIn, function (req, res) {
	var date = parseInt(req.params.date);
	if (req.session.doctor) {
		Consultation.findAll({
			raw: true,
			where: {
				date: formatDate(date),
				status: {
					$ne: null
				}
			},
			include: [{
				model: Check_Up,
				as: 'parent_record',
				attributes: ['id', 'hospitalName', 'doctorId', 'patientId'],
				include: [{
					model: Hospital,
					attributes: ['name']
				}, {
					model: Doctor,
					where: {
						id: req.session.doctor.id
					},
					attributes: ['id'],
					include: {
						model: User_Account,
						as: 'username',
						attributes: ['id', 'title', 'first_name', 'middle_name', 'last_name', 'suffix']
					}
				}, {
					model: Patient,
					where: {
						spisInstanceLicenseNo: req.session.spisinstance.license_no
					},
					attributes: ['id', 'first_name', 'middle_name', 'last_name', 'suffix']
				}]
			}]
		}).then(daily_consultation_list => {
			Patient.findAll({
				raw: true,
				where: {
					spisInstanceLicenseNo: req.session.spisinstance.license_no
				}
			}).then(patient_list => {
				Hospital.findAll({
						where: {
						spisInstanceLicenseNo: req.session.spisinstance.license_no,
						active: "t",
					},
					attributes: ['name', 'type'],
					raw: true
				}).then(hospital_list => {
					console.log(daily_consultation_list);
					res.render('daily_consultation/daily-consultation-queue.html', {
						daily_consultation_list: daily_consultation_list,
						session: req.session,
						patients: patient_list,
						hospitals: hospital_list
					});
				});
			});
		});
	} else if (req.session.secretary) {
		Consultation.findAll({
			raw: true,
			where: {
				date: formatDate(date)
			},
			include: [{
				model: Check_Up,
				as: 'parent_record',
				include: [{
					model: Hospital,
					attributes: ['name']
				}, {
					model: Doctor,
					include: {
						model: User_Account,
						as: 'username',
						attributes: ['id', 'title', 'first_name', 'middle_name', 'last_name', 'suffix']
					}
				}, {
					model: Patient,
					where: {
						spisInstanceLicenseNo: req.session.spisinstance.license_no
					},
					attributes: ['id', 'first_name', 'middle_name', 'last_name', 'suffix']
				}]
			}]
		}).then(daily_consultation_list => {
			Patient.findAll({
				raw: true,
				where: {
					spisInstanceLicenseNo: req.session.spisinstance.license_no
				}
			}).then(patient_list => {
				Doctor.findAll({
					raw: true,
					include: [{
						model: User_Account,
						as: 'username',
						where: {
							spisInstanceLicenseNo: req.session.spisinstance.license_no
						}
					}]
				}).then(doctor_list => {
					Hospital.findAll({
						where: {
							spisInstanceLicenseNo: req.session.spisinstance.license_no,
							active: "t",
						},
						attributes: ['name', 'type'],
						raw: true
					}).then(hospital_list => {
						console.log(daily_consultation_list);
						res.render('daily_consultation/daily-consultation-queue.html', {
							daily_consultation_list: daily_consultation_list,
							session: req.session,
							patients: patient_list,
							doctors: doctor_list,
							hospitals: hospital_list
						});
					});
				});
			});
		});
	}
});

/////////////////////////////// POST ////////////////////////////////////

router.post('/add_daily_consultation', requireLoggedIn, function (req, res) {
	console.log(req.body.p_id);
	Consultation.create({
		queue_no: req.body.queue_no,
		status: 'Waiting',
		date: req.body.date,
		attachments: [],
		parent_record: {
			hospitalName: req.body.hospital,
			patientId: req.body.p_id,
			doctorId: req.body.doctor,
			check_up_type: 'Consultation',
		}
	}, {
		include: [{
			model: Check_Up,
			as: 'parent_record'
		}]
	}).then(daily_consultation_instance => {
		res.json({});
	});
});

module.exports = router;