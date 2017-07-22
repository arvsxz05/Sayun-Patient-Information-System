module.exports = function(database, DataTypes) {
	const check_up_types = ['Consultation', 'In-Patient-Treatment', 'Out-Patient-Treatment'];
	
	return database.define('check_up', {
		id: {
			type: DataTypes.INTEGER,
	        autoIncrement: true,
	        primaryKey: true
		},
		check_up_type: {
			type: DataTypes.ENUM,
			values: check_up_types,
			allowNull: false,
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	});
}