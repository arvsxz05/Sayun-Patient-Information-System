const Sequelize = require('sequelize');
const database = require('./database');
const bcrypt = require('bcrypt');

const user_types = ['Doctor', 'Secretary', 'Admin'];
const institution_types = ['Clinic', 'Hospital', 'Laboratory'];
const spis_instance_types = ['active', 'deactivated'];

const User_Account = database.define('user_account', {
	id: {
		type: Sequelize.STRING(20),
		primaryKey: true,
		allowNull: false
	},
	first_name: {
		type: Sequelize.STRING(30),
		allowNull: false,
		set(val) {
	    	this.setDataValue('first_name', val.toUpperCase());
	    },
		validate: {
			is: /^[a-zA-Z\s]+$/i,
			notEmpty: true
		}
	},
	middle_name: {
		type: Sequelize.STRING(30),
		allowNull: false,
		set(val) {
	    	this.setDataValue('middle_name', val.toUpperCase());
	    },
	    validate: {
			is: /^[a-zA-Z\s]+$/i,
		}
	},
	last_name: {
		type: Sequelize.STRING(30),
		allowNull: false,
		set(val) {
	    	this.setDataValue('last_name', val.toUpperCase());
	    },
	    validate: {
			is: /^[a-zA-Z\s]+$/i,
			notEmpty: true
		}
	},
	suffix: {
		type: Sequelize.STRING(30),
		allowNull: true,
		set(val) {
	    	this.setDataValue('suffix', val.toUpperCase());
	    }
	},
	contact_number: {
		type: Sequelize.STRING(20),
		allowNull: false,
		notEmpty: true
	},
	email: {
		type: Sequelize.STRING(50),
		allowNull: false,
		validate: {
			isEmail: true,
			notEmpty: true
		}
	},
	password_hash: {
		type: Sequelize.STRING,
		allowNull: false,
		set: function (val) {
	// 		// Remember to set the data value, otherwise it won't be validated
			// bcrypt.hash(val, 10, function(err, hash) {
				this.setDataValue('password_hash', bcrypt.hashSync(val, 10));
			// });
			
		},
		validate: {
			isLongEnough: function (val) {
				if (val.length < 7) {
					throw new Error("Please choose a longer password")
				}
			}
		}
	},
	photo: {
		type: Sequelize.STRING
	}
	}, {
	timestamps: true
});

const Superuser = database.define('superuser', {
	id: {
		type: Sequelize.STRING(20),
		primaryKey: true,
		allowNull: false
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false,
		set: function (val) {
			this.setDataValue('password', bcrypt.hashSync(val, 10));
		}
	},
	contact_number: {
		type: Sequelize.STRING(20),
		allowNull: false,
		notEmpty: true
	},
	email: {
		type: Sequelize.STRING(50),
		allowNull: false,
		validate: {
			isEmail: true,
			notEmpty: true
		}
	}
});

const SPIS_Instance = database.define('spis_instance', {
	license_no: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
		allowNull: false
	},
	description: {
		type: Sequelize.TEXT,
		allowNull: false
	},
	status: {
		type: Sequelize.ENUM,
		values: spis_instance_types,
		defaultValue: 'active'
	}
});

User_Account.belongsTo(SPIS_Instance);

const Doctor = database.define('doctor', {
	license_no: {
		type: Sequelize.STRING(15),
		allowNull: false
	},
	ptr_no: {
		type: Sequelize.STRING(15),
		allowNull: false
	},
	s2_license_no: {
		type: Sequelize.STRING(15),
		allowNull: false
	}
});

const Secretary = database.define('secretary');

const Admin = database.define('admin');

Admin.belongsTo(User_Account, {as: 'username'});
Secretary.belongsTo(User_Account, {as: 'username'});
Doctor.belongsTo(User_Account, {as: 'username'});

const Hospital = database.define('hospital', {
	name: {
		type: Sequelize.STRING,
		allowNull: false,
		primaryKey: true,
	},
	address: {
		type: Sequelize.TEXT,
		allowNull: false,
	},
	type: {
		type: Sequelize.ENUM,
		values: institution_types,
		defaultValue: 'Laboratory',
	},
	active: {
		type: Sequelize.BOOLEAN,
		defaultValue: true,
	},
	contact_numbers: {
		type: Sequelize.ARRAY(Sequelize.STRING),
		allowNull: true,
	}
});

// database.sync();

// Superuser.create({
// 	id: 'sayunsuperuser',
// 	password: 's@yun',
// 	contact_number: '+639062494175',
// 	email: 'sales@sayunsolutions.com'
// }).catch(function(error) {
// 	console.log(error);
// });

module.exports.Hospital = Hospital
module.exports.User_Account = User_Account;
module.exports.Doctor = Doctor;
module.exports.Admin = Admin;
module.exports.Secretary = Secretary;
module.exports.Superuser = Superuser;
module.exports.SPIS_Instance = SPIS_Instance;