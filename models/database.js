if (!global.hasOwnProperty('db')) {
	const Sequelize = require('sequelize');
	var database = null;

	if (process.env.DATABASE_URL) {
		database = new Sequelize(process.env.DATABASE_URL);
	} else {
		var connString = 'postgres://sayunsuperuser:s@yun@127.0.0.1:5432/spis';
		database = new Sequelize(connString);
	}

	global.db = {
		Sequelize: Sequelize,
		database: database,
		Hospital: database.import(__dirname + '/hospital'),
		User_Account: database.import(__dirname + '/user_account'),
		Doctor: database.import(__dirname + '/doctor'),
		Admin: database.import(__dirname + '/admin'),
		Secretary: database.import(__dirname + '/secretary'),
		Superuser: database.import(__dirname + '/superuser'),
		SPIS_Instance: database.import(__dirname + '/spis_instance'),
		Patient: database.import(__dirname + '/patient'),
		InPatient_Treatment: database.import(__dirname + '/inpatient_treatment'),
		OutPatient_Treatment: database.import(__dirname + '/outpatient_treatment'),
		Laboratory: database.import(__dirname + '/laboratory'),
		Check_Up: database.import(__dirname + '/check_up'),
		Medication: database.import(__dirname + '/medication'),
		Medical_Procedure: database.import(__dirname + '/medical_procedure'),
		Consultation: database.import(__dirname + '/consultation'),
		Billing_Item: database.import(__dirname + '/billing_item'),
		title_types: ['Ms.', 'Mr.', 'Mrs.', 'Dr.']
	}

	global.db.User_Account.belongsTo(global.db.SPIS_Instance);
	global.db.Admin.belongsTo(global.db.User_Account, {as: 'username'});
	global.db.Secretary.belongsTo(global.db.User_Account, {as: 'username'});
	global.db.Doctor.belongsTo(global.db.User_Account, {as: 'username'});
	global.db.Hospital.belongsTo(global.db.SPIS_Instance);
	global.db.Patient.belongsTo(global.db.SPIS_Instance);
	global.db.InPatient_Treatment.belongsTo(global.db.Check_Up, {as: 'parent_record'});
	global.db.Hospital.hasMany(global.db.Check_Up);
	global.db.Check_Up.belongsTo(global.db.Hospital);
	global.db.Doctor.hasMany(global.db.Check_Up);
	global.db.Check_Up.belongsTo(global.db.Doctor);
	global.db.Patient.hasMany(global.db.Check_Up);
	global.db.Check_Up.belongsTo(global.db.Patient);
	global.db.Check_Up.hasMany(global.db.Medication, {as: "medication"});
	global.db.Medication.belongsTo(global.db.Check_Up);
	global.db.Check_Up.hasMany(global.db.Medical_Procedure, {as: "medical_procedure"});
	global.db.Medical_Procedure.belongsTo(global.db.Check_Up);
	global.db.OutPatient_Treatment.belongsTo(global.db.Check_Up, {as: 'parent_record'});
	global.db.Patient.hasMany(global.db.Laboratory);
	global.db.Hospital.hasMany(global.db.Laboratory);
	global.db.User_Account.hasMany(global.db.Billing_Item, {
		foreignKey: {
			name: 'issued_by',
			allowNull: true
		}
	});
	global.db.Laboratory.hasMany(global.db.Billing_Item, {as: 'billing_items'});
	global.db.Check_Up.hasMany(global.db.Billing_Item, {as: 'billing_items'});
	global.db.Medication.hasOne(global.db.Billing_Item, {as: 'receipt', onDelete: 'CASCADE'});
	global.db.Medical_Procedure.hasOne(global.db.Billing_Item, {as: 'receipt', onDelte: 'CASCADE'});
	global.db.Consultation.belongsTo(global.db.Check_Up, {as: 'parent_record'});
}

module.exports = global.db