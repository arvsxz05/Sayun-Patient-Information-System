const Sequelize = require('sequelize');
const database = require('./database');
const bcrypt = require('bcrypt');

const user_types = ['Doctor', 'Secretary'];
const institution_types = ['Clinic', 'Hospital', 'Laboratory', 'Others'];
const spis_instance_types = ['Active', 'Inactive'];
const title_types = ['Ms.', 'Mr.', 'Mrs.', 'Mx.'];

const User_Account = database.define('user_account', {
	id: {
		type: Sequelize.STRING(20),
		primaryKey: true,
		allowNull: false
	},
	title: {
		type: Sequelize.ENUM,
		values: title_types,
		defaultValue: 'Mx.'
	},
	first_name: {
		type: Sequelize.STRING(30),
		allowNull: false,
		set(val) {
	    	this.setDataValue('first_name', val.toUpperCase());
	    },
		validate: {
			notEmpty: true
		}
	},
	middle_name: {
		type: Sequelize.STRING(30),
		allowNull: false,
		set(val) {
	    	this.setDataValue('middle_name', val.toUpperCase());
	    }
	},
	last_name: {
		type: Sequelize.STRING(30),
		allowNull: false,
		set(val) {
	    	this.setDataValue('last_name', val.toUpperCase());
	    },
	    validate: {
			notEmpty: true
		}
	},
	suffix: {
		type: Sequelize.STRING(30),
		allowNull: true,
		set(val) {
			if (val) {
	    		this.setDataValue('suffix', val.toUpperCase());
	    	}
	    }
	},
	contact_numbers: {
		type: Sequelize.ARRAY(Sequelize.STRING),
		allowNull: false,
		notEmpty: true
	},
	email: {
		type: Sequelize.STRING(50),
		allowNull: true,
		validate: {
			isValidEmail: function (val) {
				if (val) {
					var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
					return re.test(val);
				}
			}
		}
	},
	user_type: {
		type: Sequelize.ENUM,
		values: user_types,
		allowNull: false,
		defaultValue: 'Secretary'
	},
	isAdmin: {
		type: Sequelize.BOOLEAN,
		defaultValue: false,
		allowNull: false
	},
	password_hash: {
		type: Sequelize.STRING,
		allowNull: false,
		set: function (val) {
			this.setDataValue('password_hash', bcrypt.hashSync(val, 10));
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
		type: Sequelize.ARRAY(Sequelize.STRING(20)),
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
		defaultValue: 'Active'
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
		allowNull: false,
	}
});

// database.sync();

// Superuser.create({
// 	id: 'sayunsuperuser',
// 	password: 's@yun',
// 	contact_number: ['+639062494175'],
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