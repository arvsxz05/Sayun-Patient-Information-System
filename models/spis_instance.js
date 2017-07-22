module.exports = function(database, DataTypes) {
	const spis_instance_types = ['Active', 'Inactive'];
	
	return database.define('spis_instance', {
		license_no: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
			allowNull: false
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false
		},
		status: {
			type: DataTypes.ENUM,
			values: spis_instance_types,
			defaultValue: 'Active'
		}
	});
}