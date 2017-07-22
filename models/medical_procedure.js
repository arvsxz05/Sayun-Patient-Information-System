module.exports = function(database, DataTypes) {
	return database.define('medical_procedure', {
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		details: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		attachments: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true,
		}
	});
}