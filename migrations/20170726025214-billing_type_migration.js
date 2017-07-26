'use strict';

const Sequelize = require('sequelize');
const billing_item_types = ["Medication", "Medical Procedure", "Others"];

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'billing_items',
      'type',
      {
        type: Sequelize.ENUM,
        values: billing_item_types,
        allowNull: true,
        defaultValue: "Others",
      }
    );
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('billing_items', 'type');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
