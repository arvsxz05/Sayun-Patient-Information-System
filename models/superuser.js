module.exports = function(database, DataTypes) {
	const bcrypt = require('bcrypt');
	
	return database.define('superuser', {
		id: {
			type: DataTypes.STRING(20),
			primaryKey: true,
			allowNull: false
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			set: function (val) {
				this.setDataValue('password', bcrypt.hashSync(val, 10));
			}
		},
		contact_number: {
			type: DataTypes.ARRAY(DataTypes.STRING(20)),
			allowNull: false,
			notEmpty: true
		},
		email: {
			type: DataTypes.STRING(50),
			allowNull: false,
			validate: {
				isEmail: true,
				notEmpty: true
			}
		}
	});
}