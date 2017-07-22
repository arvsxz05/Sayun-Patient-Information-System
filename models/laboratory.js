module.exports = function(database, DataTypes) {
	return database.define('laboratory', {
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false
		},
		description: {
			type: DataTypes.STRING,
			allowNull: true
		},
		notes: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		attachments: {
			type: DataTypes.ARRAY(DataTypes.STRING),
			allowNull: true
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		}
	});
}