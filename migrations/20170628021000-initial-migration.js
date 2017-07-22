'use strict';

const database = require('../models/database');


module.exports = {
  up: function (queryInterface, Sequelize) {
    database.sync();
  },

  down: function (queryInterface, Sequelize) {
    database.drop();
  }
};
