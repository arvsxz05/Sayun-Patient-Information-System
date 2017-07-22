module.exports = function(database, DataTypes) {
	const user_types = ['Doctor', 'Secretary'];
	const title_types = ['Ms.', 'Mr.', 'Mrs.', 'Dr.'];
	const bcrypt = require('bcrypt');

	return database.define('user_account', {
		id: {
			type: DataTypes.STRING(20),
			primaryKey: true,
			allowNull: false
		},
		title: {
			type: DataTypes.ENUM,
			values: title_types,
			defaultValue: 'Mr.'
		},
		first_name: {
			type: DataTypes.STRING(50),
			allowNull: false,
			set(val) {
		    	this.setDataValue('first_name', val.toUpperCase());
		    },
			validate: {
				notEmpty: true
			}
		},
		middle_name: {
			type: DataTypes.STRING(30),
			allowNull: false,
			set(val) {
		    	this.setDataValue('middle_name', val.toUpperCase());
		    }
		},
		last_name: {
			type: DataTypes.STRING(30),
			allowNull: false,
			set(val) {
		    	this.setDataValue('last_name', val.toUpperCase());
		    },
		    validate: {
				notEmpty: true
			}
		},
		suffix: {
			type: DataTypes.STRING(30),
			allowNull: true,
			set(val) {
				if (val) {
		    		this.setDataValue('suffix', val.toUpperCase());
		    	}
		    }
		},
		contact_numbers: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: false,
			notEmpty: true
		},
		email: {
			type: DataTypes.STRING(50),
			allowNull: true,
			validate: {
				isValidEmail: function (val) {
					if (val) {
						var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
						if (!re.test(val)) {
							throw new Error("Invalid Email");
						}
					}
				}
			}
		},
		user_type: {
			type: DataTypes.ENUM,
			values: user_types,
			allowNull: false,
			defaultValue: 'Secretary'
		},
		isAdmin: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false
		},
		password_hash: {
			type: DataTypes.STRING,
			allowNull: false,
			set: function (val) {
				this.setDataValue('password_hash', bcrypt.hashSync(val, 10));
			},
			validate: {
				isLongEnough: function (val) {
					if (val.length < 7) {
						throw new Error("Please choose a longer password");
					}
				}
			}
		},
		photo: {
			type: DataTypes.STRING
		}, 
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		}
		}, {
		timestamps: true
	});
}