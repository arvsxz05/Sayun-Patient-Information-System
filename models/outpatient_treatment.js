module.exports = function(database, DataTypes) {
	return database.define('outpatient_treatment', {
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		sum_of_diag: { // Summary of Diagnosis
			type: DataTypes.TEXT,
			allowNull: true,
		},
		detailed_diag: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		notes: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		attachments: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	});
}