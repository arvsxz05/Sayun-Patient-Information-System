module.exports = function(database, DataTypes) {
	const queue_status_types = ['Waiting', 'Done', 'Current'];
	const height_unit_types = ['cm', 'in', 'inft'];
	const weight_unit_types = ['kg', 'lb'];
	const temp_unit_types = ['C', 'F'];
	
	return database.define('consultation', {
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false
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
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		queue_no: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null,
		},
		status: {
			type: DataTypes.ENUM,
			values: queue_status_types,
			allowNull: true,
			defaultValue: null,
		},
		height: {
			type: DataTypes.FLOAT,
			allowNull: true,
			defaultValue: null
		},
		weight: {
			type: DataTypes.FLOAT,
			allowNull: true,
			defaultValue: null
		},
		temperature: {
			type: DataTypes.FLOAT,
			allowNull: true,
			defaultValue: null
		},
		pulse_rate: {
			type: DataTypes.INTEGER,
			allowNull: true,
			defaultValue: null
		},
		bp: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: null
		},
		height_unit: {
			type: DataTypes.ENUM,
			values: height_unit_types,
			allowNull: true,
			defaultValue: null
		},
		weight_unit: {
			type: DataTypes.ENUM,
			values: weight_unit_types,
			allowNull: true,
			defaultValue: null
		},
		temp_unit: {
			type: DataTypes.ENUM,
			values: temp_unit_types,
			allowNull: true,
			defaultValue: null
		},
	});
}