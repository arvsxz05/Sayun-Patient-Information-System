module.exports = function(database, DataTypes) {
	const medication_types = ['Maintenance', 'Non-Maintenance'];
	
	return database.define('medication', {
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		dosage: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		frequency: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		notes: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		type: {
			type: DataTypes.ENUM,
			values: medication_types,
			allowNull: false,
		}
	});
}