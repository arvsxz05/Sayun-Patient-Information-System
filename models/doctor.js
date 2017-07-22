module.exports = function(database, DataTypes) {
	return database.define('doctor', {
		license_no: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		ptr_no: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		s2_license_no: {
			type: DataTypes.STRING(20),
			allowNull: false
		},
		signature: {
			type: DataTypes.STRING
		}
	});
}