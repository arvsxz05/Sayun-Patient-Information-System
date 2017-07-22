module.exports = function(database, DataTypes) {
	const inpatient_status_types = ['Confined', 'Discharged'];
	
	return database.define('inpatient_treatment', {
		conf_date: { // CONFINEMENT DATE
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		discharge_date: { 
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		sum_of_diag: { // Summary of Diagnosis
			type: DataTypes.TEXT,
			allowNull: true,
		},
		detailed_diag: { // Detailed Diagnosis
			type: DataTypes.TEXT,
			allowNull: true,
		},
		notes: { // Detailed Diagnosis
			type: DataTypes.TEXT,
			allowNull: true,
		},
		attachments: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		},
		status: {
			type: DataTypes.ENUM,
			values: inpatient_status_types,
			defaultValue: 'Confined'
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	});
}