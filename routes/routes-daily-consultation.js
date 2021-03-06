module.exports = function(io) {
	const express = require('express');
	const router = express.Router();
	const Sequelize = require('sequelize');
	const Consultation = require('../models/database').Consultation;
	const Check_Up = require('../models/database').Check_Up;
	const Hospital = require('../models/database').Hospital;
	const Doctor = require('../models/database').Doctor;
	const Secretary = require('../models/database').Secretary;
	const Patient = require('../models/database').Patient;
	const User_Account = require('../models/database').User_Account;

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

	//////////////////////////////////////////////////////////////////////////////////

	function getDailyConsultation (doctor, date, session) {
		if (session.doctor) {
			Consultation.findAll({
				raw: true,
				where: {
					date: formatDate(date),
					status: {
						$ne: null,
						$in: ['Waiting', 'Current']
					},
					active: true
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
							id: session.doctor.id
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
							spisInstanceLicenseNo: session.spisinstance.license_no
						},
						attributes: ['id', 'first_name', 'middle_name', 'last_name', 'suffix']
					}]
				}]
			}).then(daily_consultation_list => {
				io.emit('edited_consultation', {
					doctor: session.user.id,
					date: new Date(date).toDateString(),
					daily_consultation_list: daily_consultation_list
				});
			});
		} else if (session.secretary) {
			Doctor.findOne({
				where: {
					id: doctor
				}
			}).then(single_doctor => {
				if (single_doctor) {
					Consultation.findAll({
						raw: true,
						where: {
							date: formatDate(date),
							status: {
								$ne: null,
								$in: ['Waiting', 'Current']
							}
						},
						include: [{
							model: Check_Up,
							required: true,
							as: 'parent_record',
							include: [{
								model: Hospital,
								attributes: ['name'],
							}, {
								model: Doctor,
								required: true,
								where: {
									id: doctor
								},
								include: {
									model: User_Account,
									required: true,
									as: 'username',
									attributes: ['id', 'title', 'first_name', 'middle_name', 'last_name', 'suffix']
								}
							}, {
								model: Patient,
								required: true,
								where: {
									spisInstanceLicenseNo: session.spisinstance.license_no
								},
								attributes: ['id', 'first_name', 'middle_name', 'last_name', 'suffix']
							}]
						}]
					}).then(daily_consultation_list => {
						io.emit('edited_consultation', {
							doctor: single_doctor.usernameId,
							date: new Date(date).toDateString(),
							daily_consultation_list: daily_consultation_list
						});
					});
				} else {
					return null;
				}
			});
		}
	}

	/////////////////////////////// GET ////////////////////////////////////

	router.get('/daily_consultation_list/:doc_username/:day_arg/:month_arg/:year_arg', requireLoggedIn, function (req, res) {
		// console.log(req.params['year_arg'] + '/' + req.params['month_arg'] + '/' + req.params['day_arg']);
		var date = new Date(parseInt(req.params.year_arg), parseInt(req.params.month_arg), parseInt(req.params.day_arg));
		var doctor = req.params.doc_username;
		if (req.session.doctor) {
			Consultation.findAll({
				raw: true,
				where: {
					date: date,
					status: {
						$ne: null,
						$in: ['Waiting', 'Current']
					},
					active: true
				},
				attributes: ['id', 'status', 'date', 'queue_no', 'parentRecordId'],
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
							doctor_on_queue: req.session.user.id,
							date_on_queue: date.toDateString()
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
							date: date,
							status: {
								$ne: null,
								$in: ['Waiting', 'Current']
							},
							active: true
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
										doctor_on_queue: doctor,
										date_on_queue: date.toDateString()
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

	router.get('/get_daily_cc/:cc_id', requireLoggedIn, function (req, res) {
		Consultation.findOne({
			raw: true,
			where: {
				id: req.params.cc_id,
				active: true,
				status: {
					$ne: null,
				}
			},
			include: [{
				model: Check_Up,
				as: 'parent_record',
				include: [{
					model: Patient,
					attributes: ['first_name', 'middle_name', 'last_name', 'suffix']
				}]
			}]
		}).then(consultation_instance => {
			if(consultation_instance) {
				res.json({
					success: true,
					cc_inst: consultation_instance
				});
			} else {
				res.json({error: 'Data already not available.'});
			}
		}).catch(error => {
			res.json({error: error});
		});
	});

	router.post('/change_status', requireLoggedIn, function (req, res) {
		Consultation.findOne({
			where: {
				id: req.body['con-id']
			}, include: [{
				model: Check_Up,
				as: 'parent_record'
			}]
		}).then(consultation_instance => {
			if(consultation_instance) {
				consultation_instance.status = req.body['status'];
				consultation_instance.save().then(() => {
					if(req.body['status'] === 'Done') {
						Consultation.findAll({
							where: {
								queue_no: {
									$gt: consultation_instance.queue_no
								},
								status: {
									$in: ['Waiting', 'Current']
								},
								date: consultation_instance.date,
								active: true
							}, include: [{
								model: Check_Up,
								as: 'parent_record',
								where: { doctorId: consultation_instance.parent_record.doctorId },
								required: true
							}]
						}).then(consultation_below => {
							// console.log(consultation_below);
							var itemsProcessed = 0;
							if(consultation_below.length > 0) {
								consultation_below.forEach(function(t) {
									t.update({ queue_no: Sequelize.literal('queue_no - 1')}).then(() => {
										itemsProcessed++;
										if(itemsProcessed === consultation_below.length) {
											getDailyConsultation(consultation_instance.parent_record.doctorId, new Date(consultation_instance.date).getTime(), req.session);
											res.json({});
										}
									});
								});
							} else {
								getDailyConsultation(consultation_instance.parent_record.doctorId, new Date(consultation_instance.date).getTime(), req.session);
								res.json({});
							}
						});
					} else {
						getDailyConsultation(consultation_instance.parent_record.doctorId, new Date(consultation_instance.date).getTime(), req.session);
						res.json({});
					}
				});
			} else {
				res.json({error: "Cannot change status of undefined"});
			}
		});
	});

	router.post('/edit_daily_consultation', requireLoggedIn, function (req, res) {
		var height = req.body.height;
        var height_unit = req.body.height_unit;
        var weight = req.body.weight;
        var weight_unit = req.body.weight_unit;
        var temp = req.body.temp;
        var temp_unit = req.body.temp_unit;
        var bp = req.body.bp;
        var pulse = req.body.pulse;
        
		if (height && height.trim() !== '') {
            height = parseFloat(height.trim());
            if (isNaN(height)) {
                height = null;
                height_unit = null;
            }
        } else {
            height = null;
            height_unit = null;
        }

        if (weight && weight.trim() !== '') {
            weight = parseFloat(weight.trim());
            if (isNaN(weight)) {
                weight = null;
                weight_unit = null;
            }
        } else {
            weight = null;
            weight_unit = null;
        }

        if (temp && temp.trim() !== '') {
            temp = parseFloat(temp.trim());
            if (isNaN(temp)) {
                temp = null;
                temp_unit = null;
            }
        } else {
            temp = null;
            temp_unit = null;
        }

        if (!bp || bp.trim() === '') {
            bp = null;
        }

        if (pulse && pulse.trim() !== '') {
            pulse = parseInt(pulse.trim());
            if (isNaN(pulse)) {
                pulse = null;
            }
        } else {
            pulse = null;
        }

		Consultation.findOne({
			where: {
				id: req.body['consultation_id'].trim()
			},
			include: [
				{ model: Check_Up, as: 'parent_record', include: [{ model: Doctor, }]}
			]
		}).then(consultation_instance => {
			// console.log('eredsh');
			if (consultation_instance) {
				var fixed_date = new Date(consultation_instance.date);
				var old_date = new Date(consultation_instance.date);
				if(req.body['date'] && req.body['date'].trim() !== '') {
					fixed_date = new Date(req.body['date'].trim());
				}
				var count_options = {
					where: {
						date: fixed_date,
						status: {
							$in: ['Waiting', 'Current']
						},
						active: true
					},
					include: [{
						model: Check_Up,
						as: 'parent_record',
						where: { doctorId: req.body['doctor'].trim() }
					}]
				};
				var below_finder_options = {
					where: {
						queue_no: {
							$gt: consultation_instance.queue_no
						},
						status: {
							$in: ['Waiting', 'Current']
						},
						date: consultation_instance.date,
						active: true
					}, include: [{
						model: Check_Up,
						as: 'parent_record',
						where: { doctorId: consultation_instance.parent_record.doctorId },
						required: true
					}]
				};
				if (req.body['status'].trim() == 'Done') {		// meaning dili ta mucare sa iyang order sa queue, ang after ra niya'
					Consultation.findAll(below_finder_options).then(consultation_below => {
						var itemsProcessed = 0;
						if(consultation_below.length > 0) {
							consultation_below.forEach(function(t) {
								t.update({ queue_no: Sequelize.literal('queue_no - 1')}).then(() => {
									itemsProcessed++;
									if(itemsProcessed === consultation_below.length) {
										consultation_instance.parent_record.updateAttributes({
											doctorId: req.body['doctor'].trim(),
											hospitalName: req.body['hospital'].trim()
										}).then(function (result) {
											consultation_instance.date = fixed_date;
											consultation_instance.status = req.body['status'].trim();
											consultation_instance.height = height;
											consultation_instance.height_unit = height_unit;
											consultation_instance.weight = weight;
											consultation_instance.weight_unit = weight_unit;
											consultation_instance.temperature = temp;
											consultation_instance.temp_unit = temp_unit;
											consultation_instance.bp = bp;
											consultation_instance.pulse_rate = pulse;
											consultation_instance.save().then(() => {
												getDailyConsultation(consultation_instance.parent_record.doctorId, old_date.getTime(), req.session);
											});
										});
									}
								});
							});
						} else {
							consultation_instance.parent_record.updateAttributes({
								doctorId: req.body['doctor'].trim(),
								hospitalName: req.body['hospital'].trim()
							}).then(function (result) {
								consultation_instance.date = fixed_date;
								consultation_instance.status = req.body['status'].trim();
								consultation_instance.height = height;
								consultation_instance.height_unit = height_unit;
								consultation_instance.weight = weight;
								consultation_instance.weight_unit = weight_unit;
								consultation_instance.temperature = temp;
								consultation_instance.temp_unit = temp_unit;
								consultation_instance.bp = bp;
								consultation_instance.pulse_rate = pulse;
								consultation_instance.save().then(() => {
									getDailyConsultation(consultation_instance.parent_record.doctorId, old_date.getTime(), req.session);
								});
							});
						}
					});
				} else {
					if (consultation_instance.parent_record.doctorId != req.body['doctor'].trim() || 
						(req.body['date'] && req.body['date'].trim() !== '' && new Date(req.body['date'].trim()) != new Date(consultation_instance.date))) {
						// Reorder to another queue

						Consultation.findAll(below_finder_options).then(consultation_below => {
							var itemsProcessed = 0;
							if(consultation_below.length > 0) {
								consultation_below.forEach(function(t) {
									t.update({ queue_no: Sequelize.literal('queue_no - 1')}).then(() => {
										itemsProcessed++;
										if(itemsProcessed === consultation_below.length) {
											Consultation.count(count_options).then(queue_no => {
												consultation_instance.parent_record.updateAttributes({
													doctorId: req.body['doctor'].trim(),
													hospitalName: req.body['hospital'].trim()
												}).then(function (result) {
													consultation_instance.date = fixed_date;
													consultation_instance.status = req.body['status'].trim();
													consultation_instance.queue_no = queue_no + 1;
													consultation_instance.height = height;
													consultation_instance.height_unit = height_unit;
													consultation_instance.weight = weight;
													consultation_instance.weight_unit = weight_unit;
													consultation_instance.temperature = temp;
													consultation_instance.temp_unit = temp_unit;
													consultation_instance.bp = bp;
													consultation_instance.pulse_rate = pulse;
													consultation_instance.save().then(() => {
														/////////////////
														if(req.body['date'] && req.body['date'].trim() !== '') {
															if(consultation_instance.parent_record.doctorId != req.body['doctor'].trim()) { // nailisan ang both time and doctor
																getDailyConsultation(req.body.doctor, new Date(req.body['date'].trim()).getTime(), req.session);
																getDailyConsultation(consultation_instance.parent_record.doctorId,  old_date.getTime(), req.session);
															} else {	// nailisan ra ang time, same ra ang doctor
																getDailyConsultation(consultation_instance.parent_record.doctorId, new Date(req.body['date'].trim()).getTime(), req.session);
																getDailyConsultation(consultation_instance.parent_record.doctorId, old_date.getTime(), req.session);
															}
														} else {		// nailisan ra ang doctor, same ra ang time
															getDailyConsultation(req.body.doctor, old_date.getTime(), req.session);
															getDailyConsultation(consultation_instance.parent_record.doctorId, old_date.getTime(), req.session);
														}
														res.json({});
													});
												});
											});
										}
									});
								});
							} else {
								Consultation.count(count_options).then(queue_no => {
									consultation_instance.parent_record.updateAttributes({
										doctorId: req.body['doctor'].trim(),
										hospitalName: req.body['hospital'].trim()
									}).then(function (result) {
										consultation_instance.date = fixed_date;
										consultation_instance.status = req.body['status'].trim();
										consultation_instance.queue_no = queue_no + 1;
										consultation_instance.height = height;
										consultation_instance.height_unit = height_unit;
										consultation_instance.weight = weight;
										consultation_instance.weight_unit = weight_unit;
										consultation_instance.temperature = temp;
										consultation_instance.temp_unit = temp_unit;
										consultation_instance.bp = bp;
										consultation_instance.pulse_rate = pulse;
										consultation_instance.save().then(() => {
											if(req.body['date'] && req.body['date'].trim() !== '') {
												if(consultation_instance.parent_record.doctorId != req.body['doctor'].trim()) { // nailisan ang both time and doctor
													getDailyConsultation(req.body.doctor, new Date(req.body['date'].trim()).getTime(), req.session);
													getDailyConsultation(consultation_instance.parent_record.doctorId,  old_date.getTime(), req.session);
												} else {	// nailisan ra ang time, same ra ang doctor
													getDailyConsultation(consultation_instance.parent_record.doctorId, new Date(req.body['date'].trim()).getTime(), req.session);
													getDailyConsultation(consultation_instance.parent_record.doctorId, old_date.getTime(), req.session);
												}
											} else {		// nailisan ra ang doctor, same ra ang time
												getDailyConsultation(req.body.doctor, old_date.getTime(), req.session);
												getDailyConsultation(consultation_instance.parent_record.doctorId, old_date.getTime(), req.session);
											}
											res.json({});
										});
									});
								});
							}
						});
					} else {
						// No need to reorder
						consultation_instance.parent_record.updateAttributes({
							hospitalName: req.body['hospital'].trim()
						}).then(function (result) {
							consultation_instance.status = req.body['status'].trim();
							consultation_instance.height = height;
							consultation_instance.height_unit = height_unit;
							consultation_instance.weight = weight;
							consultation_instance.weight_unit = weight_unit;
							consultation_instance.temperature = temp;
							consultation_instance.temp_unit = temp_unit;
							consultation_instance.bp = bp;
							consultation_instance.pulse_rate = pulse;
							consultation_instance.save().then(() => {
								getDailyConsultation(consultation_instance.parent_record.doctorId, old_date.getTime(), req.session);
								res.json({});
							});
						});
					}
				}
			} else {
				res.send('Invalid Consultation Code!');
			}
		});
	});

	router.get('/reorder/:doc_username/:day_arg/:month_arg/:year_arg', requireLoggedIn, function (req, res) {
		
		var date = new Date(parseInt(req.params.year_arg), parseInt(req.params.month_arg), parseInt(req.params.day_arg));
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
							$ne: null,
							$in: ['Waiting', 'Current']
						},
						active: true
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
					// console.log(single_doctor);
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
		console.log(req.body);
		var date = new Date(req.body.date);
		var date_iso = date.toISOString();

		var height = req.body.height;
        var height_unit = req.body.height_unit;
        var weight = req.body.weight;
        var weight_unit = req.body.weight_unit;
        var temp = req.body.temp;
        var temp_unit = req.body.temp_unit;
        var bp = req.body.bp;
        var pulse = req.body.pulse;
        
		if (height && height.trim() !== '') {
            height = parseFloat(height.trim());
            if (isNaN(height)) {
                height = null;
                height_unit = null;
            }
        } else {
            height = null;
            height_unit = null;
        }

        if (weight && weight.trim() !== '') {
            weight = parseFloat(weight.trim());
            if (isNaN(weight)) {
                weight = null;
                weight_unit = null;
            }
        } else {
            weight = null;
            weight_unit = null;
        }

        if (temp && temp.trim() !== '') {
            temp = parseFloat(temp.trim());
            if (isNaN(temp)) {
                temp = null;
                temp_unit = null;
            }
        } else {
            temp = null;
            temp_unit = null;
        }

        if (!bp || bp.trim() === '') {
            bp = null;
        }

        if (pulse && pulse.trim() !== '') {
            pulse = parseInt(pulse.trim());
            if (isNaN(pulse)) {
                pulse = null;
            }
        } else {
            pulse = null;
        }

		Consultation.count({
			where: {
				date: date_iso,
				status: {
					$in: ['Waiting', 'Current']
				},
				active: true
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
				date: date_iso,
				attachments: [],
				height: height,
				height_unit: height_unit,
				weight: weight,
				weight_unit: weight_unit,
				temperature: temp,
				temp_unit: temp_unit,
				bp: bp,
				pulse_rate: pulse,
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
					raw: true,
					where: {
						id: req.body.doctor
					},
					attributes: ['usernameId'],
					include: [{
						model: User_Account,
						as: 'username',
						attributes: ['first_name', 'middle_name', 'last_name', 'suffix']
					}]
				}).then(doctor_instance => {
					Patient.findOne({
						raw: true,
						where: {
							id: daily_consultation_instance['parent_record']['patientId']
						},
						attributes: ['id', 'first_name', 'middle_name', 'last_name', 'suffix']
					}).then(patient_instance => {
						io.emit('new_consultation', {
							patient: patient_instance,
							date: date.toDateString(),
							doctor: doctor_instance,
							add: daily_consultation_instance.dataValues
						});
					res.json({success: true});
					}).catch(error => {
						res.json({error: error});
					});
				});
			}).catch(error => {
				res.json({error: error});
			});
		});
	});

	router.post('/reorder/:doc_username/:day_arg/:month_arg/:year_arg', requireLoggedIn, function (req, res) {
		var date = new Date(parseInt(req.params.year_arg), parseInt(req.params.month_arg), parseInt(req.params.day_arg));
		Doctor.findOne({
			raw: true,
			where: {
				usernameId: req.params.doc_username
			}
		}).then(single_doctor => {
			if (single_doctor) {
				var reordered_queue = req.body.queue;
				var itemsProcessed = 0;
				reordered_queue.forEach(function (item) {
					Consultation.update({ queue_no: item.value }, { where: { id: item.key } }).then(() => {
						itemsProcessed++;
						if(itemsProcessed === reordered_queue.length) {
							getDailyConsultation(single_doctor.id, date, req.session);
							res.json({});
						}
					});
				});
			} else {
				res.json({error: "Doctor not found."});
			}
		});
	});

	router.post('/delete_daily_consultation/:consultation_id', requireLoggedIn, function (req, res) {
		Consultation.findOne({
			where: {
				id: req.params.consultation_id
			},
			include: [{
				model: Check_Up,
				as: 'parent_record'
			}]
		}).then(consultation_instance => {
			if (consultation_instance) {
				var queue_no = consultation_instance.queue_no;
				var date = consultation_instance.date,
					doctorId = consultation_instance.parent_record.doctorId;

				consultation_instance.parent_record.destroy();
				consultation_instance.destroy();
				Consultation.findAll({
					where: {
						queue_no: {
							$gt: queue_no
						},
						status: {
							$in: ['Waiting', 'Current']
						},
						date: date,
						active: true
					}, include: [{
						model: Check_Up,
						as: 'parent_record',
						where: { doctorId: doctorId },
						required: true
					}]
				}).then(consultation_below => {
					var itemsProcessed = 0;
					if(consultation_below.length > 0) {
						consultation_below.forEach(function(t) {
							t.update({ queue_no: Sequelize.literal('queue_no - 1')}).then(() => {
								itemsProcessed++;
								if(itemsProcessed === consultation_below.length) {
									getDailyConsultation(doctorId, new Date(date).getTime(), req.session);
									res.json({success: true});
								}
							});
						});
					} else {
						getDailyConsultation(doctorId, new Date(date).getTime(), req.session);
						res.json({success: true});
					}
				}).catch(function(error) {
					console.log("/delete_daily_consultation");
					console.log(error);
					res.json({success: false});
				});
			} else {
				res.json({error: "Consultation not found."});
			}
		});
	});

	
	router.post("/clinic_consultation_delete_confirmed/:cc_id", requireLoggedIn, function(req, res){
		var key = req.params.cc_id;
		Consultation.findOne({
			where: {
				id: key
			},
			include: [{
				model: Check_Up,
				as: 'parent_record'
			}]
		}).then(consultation_instance => {
			if (consultation_instance) {
				if(consultation_instance.status && consultation_instance.status != 'Done') {
					var queue_no = consultation_instance.queue_no;
					var date = consultation_instance.date,
						doctorId = consultation_instance.parent_record.doctorId;

					consultation_instance.parent_record.destroy();
					consultation_instance.destroy();
					Consultation.findAll({
						where: {
							queue_no: {
								$gt: queue_no
							},
							status: {
								$in: ['Waiting', 'Current']
							},
							date: date,
							active: true
						}, include: [{
							model: Check_Up,
							as: 'parent_record',
							where: { doctorId: doctorId },
							required: true
						}]
					}).then(consultation_below => {
						var itemsProcessed = 0;
						if(consultation_below.length > 0) {
							consultation_below.forEach(function(t) {
								t.update({ queue_no: Sequelize.literal('queue_no - 1')}).then(() => {
									itemsProcessed++;
									if(itemsProcessed === consultation_below.length) {
										getDailyConsultation(doctorId, new Date(date).getTime(), req.session);
										res.json({success: true});
									}
								});
							});
						} else {
							getDailyConsultation(doctorId, new Date(date).getTime(), req.session);
							res.json({success: true});
						}
					}).catch(function(error) {
						console.log("/clinic_consultation_delete_confirmed");
						console.log(error);
						res.json({success: false});
					});
				} else {
					Consultation.update({
						active: false,
					}, {
						where: {
							id: key,
						},
						returning: true,
						raw: true,
					}).then(function (cc_result) {
						Check_Up.update({
							active: false,
						}, {
							where: {
								id: cc_result[1][0]['parentRecordId'],
							},
							returning: true,
							raw: true,
						}).then(function (check_up_result) {
							res.json({success: true});
						});
					}).catch(function (error) {
						res.json({success: false});
					});
				}
			} else {
				res.json({success: false});
			}
		});
	});

	router.get('/daily_consultation_list/:doc_username/:day_arg/:month_arg/:year_arg/done', requireLoggedIn, function (req, res) {
		console.log(req.params.year_arg + "/" + req.params.month_arg + "/" + req.params.day_arg);
		var date = new Date(parseInt(req.params.year_arg), parseInt(req.params.month_arg), parseInt(req.params.day_arg));
		var doctor = req.params.doc_username;
		if (req.session.doctor) {
			Consultation.findAll({
				raw: true,
				where: {
					date: formatDate(date),
					status: {
						$ne: null,
						$in: ['Done']
					},
					active: true
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
				res.render('daily_consultation/done_queue.html', {
					daily_consultation_list: daily_consultation_list,
					session: req.session,
					doctor_on_queue: req.session.user.id,
					date_on_queue: new Date(date).toDateString()
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
							date: formatDate(date),
							status: {
								$ne: null,
								$in: ['Done']
							},
							active: true
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
							
								res.render('daily_consultation/done_queue.html', {
									daily_consultation_list: daily_consultation_list,
									session: req.session,
									doctors: doctor_list,
									doctor_on_queue: doctor,
									date_on_queue: new Date(date).toDateString()
								});
						});
					});
				} else {
					res.send('Doctor not found!');
				}
			});
		}
	});

	return router;
}