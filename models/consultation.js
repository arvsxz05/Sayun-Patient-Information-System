module.exports = function(database, DataTypes) {
	const queue_status_types = ['Waiting', 'Done', 'Current'];
	
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
		}
	});
}