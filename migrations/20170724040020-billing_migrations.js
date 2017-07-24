'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn(
      'billing_items',
      'receiptId',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
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
    return queryInterface.removeColumn('billing_items', 'receiptId');
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
