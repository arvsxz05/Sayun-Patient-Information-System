module.exports = function(database, DataTypes) {
	const billing_item_edited_type = ['Doctor', 'Secretary'];
	const billing_item_types = ["Medication", "Medical Procedure", "Others"];
	
	return database.define('billing_item', {
		description: {
			type: DataTypes.STRING,
			allowNull: false
		},
		amount: {
			type: DataTypes.FLOAT,
			allowNull: false,
			defaultValue: 0
		},//,
		// last_edited: {
		// 	type: DataTypes.ENUM,
		// 	values: billing_item_edited_type,
		// 	allowNull: false,
		// 	defaultValue: "Secretary"
		// }
		receiptId: {
			type: DataTypes.INTEGER,
			allowNull: true,
		},
		type: {
			type: DataTypes.ENUM,
			values: billing_item_types,
			allowNull: true,
			defaultValue: "Others",
		}
	});
}