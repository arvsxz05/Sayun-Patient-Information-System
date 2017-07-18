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

router.get('/daily_consultation_list/:doc_username/:date', requireLoggedIn, function (req, res) {
	var date = parseInt(req.params.date);
	var doctor = req.params.doc_username;
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
				required: true,
				attributes: ['id', 'hospitalName', 'doctorId', 'patientId'],
				include: [{
					model: Hospital,
					attributes: ['name']
				}, {
					model: Doctor,
					required: true,
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
					required: true,
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
					res.render('daily_consultation/daily-consultation-queue.html', {
						daily_consultation_list: daily_consultation_list,
						session: req.session,
						patients: patient_list,
						hospitals: hospital_list,
						doctor_on_queue: req.session.user.id
					});
				});
			});
		});
	} else if (req.session.secretary) {
		Doctor.findOne({
			where: {
				usernameId: doctor
			}
		}).then(single_doctor => {
			if (single_doctor) {
				Consultation.findAll({
					raw: true,
					where: {
						date: formatDate(date)
					},
					include: [{
						model: Check_Up,
						required: true,
						as: 'parent_record',
						include: [{
							model: Hospital,
							attributes: ['name']
						}, {
							model: Doctor,
							required: true,
							include: {
								model: User_Account,
								required: true,
								as: 'username',
								where: {
									id: doctor
								},
								attributes: ['id', 'title', 'first_name', 'middle_name', 'last_name', 'suffix']
							}
						}, {
							model: Patient,
							required: true,
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
								res.render('daily_consultation/daily-consultation-queue.html', {
									daily_consultation_list: daily_consultation_list,
									session: req.session,
									patients: patient_list,
									doctors: doctor_list,
									hospitals: hospital_list,
									doctor_on_queue: doctor
								});
							});
						});
					});
				});
			} else {
				res.send('Doctor not found!');
			}
		});
	}
});

router.get('/reorder/:doc_username/:date', requireLoggedIn, function (req, res) {
	var date = parseInt(req.params.date.trim());
	var doctor = req.params.doc_username;
	Doctor.findOne({
		raw: true,
		where: {
			usernameId: doctor
		},
		include: [{
			model: User_Account,
			as: 'username',
			attributes: ['id', 'title', 'first_name', 'middle_name', 'last_name', 'suffix']
		}]
	}).then(single_doctor => {
		if (single_doctor) {
			var doctor_include_options = null;
			if (req.session.doctor) {
				doctor_include_options = {
					usernameId: req.session.user.id
				};
			} else if (req.session.secretary) {
				doctor_include_options = {
					usernameId: doctor
				};
			}
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
					required: true,
					attributes: ['id', 'hospitalName', 'doctorId', 'patientId'],
					include: [{
						model: Hospital,
						attributes: ['name']
					}, {
						model: Doctor,
						required: true,
						attributes: ['id'],
						where: doctor_include_options
					}, {
						model: Patient,
						required: true,
						where: {
							spisInstanceLicenseNo: req.session.spisinstance.license_no
						},
						attributes: ['id', 'first_name', 'middle_name', 'last_name', 'suffix']
					}]
				}]
			}).then(daily_consultation_list => {
				console.log(single_doctor);
				res.render('daily_consultation/reorder-queue.html', {
					daily_consultation_list: daily_consultation_list,
					session: req.session,
					doctor_on_queue: single_doctor,
					date_on_queue: new Date(date).toDateString()
				});
			});
		} else {
			res.send('Doctor not found!');
		}
	});
});

/////////////////////////////// POST ////////////////////////////////////

router.post('/add_daily_consultation', requireLoggedIn, function (req, res) {
	console.log(req.body.p_id);
	Consultation.count({
		where: {
			date: req.body.date,
			status: {
				$in: ['Waiting', 'Current']
			},
		},
		include: [{
			model: Check_Up,
			as: 'parent_record',
			where: { doctorId: req.body.doctor }
		}]
	}).then(queue_no => {
		Consultation.create({
			queue_no: queue_no + 1,
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
			Doctor.findOne({
				where: {
					id: req.body.doctor
				},
				attributes: ['usernameId']
			}).then(doctor_instance => {
				res.redirect('/daily_consultation_list/' + doctor_instance.usernameId + '/' + new Date(req.body.date).getTime());
			})
		});
	});
});

module.exports = router;