'use strict';

const Sequelize = require('sequelize');
const height_unit_types = ['cm', 'in', 'inft'];
const weight_unit_types = ['kg', 'lb'];
const temp_unit_types = ['C', 'F'];

module.exports = {
	up: function (queryInterface, Sequelize) {
		return Promise.all([
			queryInterface.addColumn('consultations', 'height', {
				type: Sequelize.FLOAT,
				allowNull: true,
				defaultValue: null
			}),
			queryInterface.addColumn('consultations', 'weight', {
				type: Sequelize.FLOAT,
				allowNull: true,
				defaultValue: null
			}),
			queryInterface.addColumn('consultations', 'temperature', {
				type: Sequelize.FLOAT,
				allowNull: true,
				defaultValue: null
			}),
			queryInterface.addColumn('consultations', 'pulse_rate', {
				type: Sequelize.INTEGER,
				allowNull: true,
				defaultValue: null
			}),
			queryInterface.addColumn('consultations', 'bp', {
				type: Sequelize.STRING,
				allowNull: true,
				defaultValue: null
			}),
			queryInterface.addColumn('consultations', 'height_unit', {
				type: Sequelize.ENUM,
				values: height_unit_types,
				allowNull: true,
				defaultValue: null
			}),
			queryInterface.addColumn('consultations', 'weight_unit', {
				type: Sequelize.ENUM,
				values: weight_unit_types,
				allowNull: true,
				defaultValue: null
			}),
			queryInterface.addColumn('consultations', 'temp_unit', {
				type: Sequelize.ENUM,
				values: temp_unit_types,
				allowNull: true,
				defaultValue: null
			}),
		]);
	},

	down: function (queryInterface, Sequelize) {
		return queryInterface.removeColumn('consultations', 'height').then(function () {
			return queryInterface.removeColumn('consultations', 'weight').then(function () {
				return queryInterface.removeColumn('consultations', 'temperature').then(function () {
					return queryInterface.removeColumn('consultations', 'pulse_rate').then(function () {
						return queryInterface.removeColumn('consultations', 'bp').then(function () {
							return queryInterface.removeColumn('consultations', 'height_unit').then(function () {
								return queryInterface.removeColumn('consultations', 'weight_unit').then(function () {
									return queryInterface.removeColumn('consultations', 'temp_unit');
								});
							});
						});
					});
				});
			});
		});
	}
};
