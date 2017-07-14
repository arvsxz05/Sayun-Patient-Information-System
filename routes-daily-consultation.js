const express = require('express');
const router = express.Router();
const Daily_Consultation = require('./models').Daily_Consultation;
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

/////////////////////////////// GET ////////////////////////////////////

router.get('/daily_consultation_list', requireLoggedIn, function (req, res) {
	if (req.session.doctor) {
		Daily_Consultation.findAll({
			raw: true,
			include: [{
				model: Consultation,
				as: 'consultation_records',
				include: [{
					model: Check_Up,
					as: 'parent_record',
					include: [{
						model: Hospital,
						attributes: ['name']
					}, {
						model: Doctor,
						where: {
							id: req.session.doctor.id
						},
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
		Daily_Consultation.findAll({
			raw: true,
			include: [{
				model: Consultation,
				as: 'consultation_records',
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
	Daily_Consultation.count({where: {
		date: req.body.date
	}}).then(queue_no => {
		Daily_Consultation.create({
			date: req.body.date,
			queue_no: queue_no,
			status: 'Waiting',
			consultation_records: {
				date: req.body.date,
				parent_record: {
					hospitalName: req.body.hospital,
					patientId: req.body.p_id,
					doctorId: req.body.doctor,
					check_up_type: 'Consultation',
				}
			}
		}, {
			include: [{
				model: Consultation,
				as: 'consultation_records',
				include: [{
					model: Check_Up,
					as: 'parent_record'
				}]
			}]
		}).then(daily_consultation_instance => {
			res.json({});
		});
	});
});

module.exports = router;