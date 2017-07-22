module.exports = function(database, DataTypes) {
	const institution_types = ['Clinic', 'Hospital', 'Laboratory', 'Others'];
	
	return database.define('hospital', {
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			primaryKey: true,
		},
		address: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		type: {
			type: DataTypes.ENUM,
			values: institution_types,
			defaultValue: 'Laboratory',
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		contact_numbers: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: false,
		}
	});
}