'use strict';

const database = require('../models/database').database;
const Superuser = require('../models/database').Superuser;

module.exports = {
	up: function (queryInterface, Sequelize) {
		return database.sync({force: true}).then(function () {
			Superuser.create({
				id: 'sayunsuperuser',
				password: 's@yun',
				contact_number: ['+639062494175'],
				email: 'sales@sayunsolutions.com'
			}).then(superuser => {
				console.log("Super User Added Successfully.")
			}).catch(function(error) {
				console.log(error);
			});
		});
	},

	down: function (queryInterface, Sequelize) {
		return database.drop();
	}
};
