'use strict';

const Sequelize = require('sequelize');

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn(
      'user_accounts',
      'middle_name',
      {
        type: Sequelize.STRING,
        allowNull: true,
        set(val){
          this.setDataValue('middle_name', val.toUpperCase());
        }
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
    return queryInterface.changeColumn(
      'user_accounts',
      'middle_name',
      {
        type: Sequelize.STRING,
        allowNull: false,
        set(val){
          this.setDataValue('middle_name', val.toUpperCase());
        }
      }
      );
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
