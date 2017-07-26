module.exports = function(database, DataTypes) {
	const civil_status_types = ['Single', 'Married', 'Divorced', 'Separated', 'Widowed'];
	const sex_types = ['Female', 'Male'];

	return database.define('patient', {
		id: {
			type: DataTypes.INTEGER,
	        autoIncrement: true,
	        primaryKey: true
		},
		reg_date: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		first_name: {
			type: DataTypes.STRING(30),
			allowNull: false,
			set(val) {
		    	this.setDataValue('first_name', val.toUpperCase());
		    },
			validate: {
				notEmpty: true
			}
		},
		middle_name: {
			type: DataTypes.STRING(30),
			allowNull: true,
			set(val) {
		    	this.setDataValue('middle_name', val.toUpperCase());
		    }
		},
		last_name: {
			type: DataTypes.STRING(30),
			allowNull: false,
			set(val) {
		    	this.setDataValue('last_name', val.toUpperCase());
		    },
		    validate: {
				notEmpty: true
			}
		},
		suffix: {
			type: DataTypes.STRING(10),
			allowNull: true
		},
		sex: {
			type: DataTypes.ENUM,
			values: sex_types,
			allowNull: false
		},
		birthdate: {
			type: DataTypes.DATEONLY,
			allowNull: false
		},
		nationality: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false,
		}, 
		email: {
			type: DataTypes.STRING(50),
			allowNull: true,
			validate: {
				isValidEmail: function (val) {
					if (val) {
						var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
						if (!re.test(val)) {
							throw new Error("Invalid Email");
						}
					}
				}
			}
		},
		phone_number: {
			type: DataTypes.STRING(20),
			allowNull: true,
		}, 
		alt_cn: { // ALTERNATIVE CONTACT NUMBER
	 		type: DataTypes.STRING(20),
			allowNull: true,
		},
		em_cp: { // EMERGENCY CONTACT PERSON
			type: DataTypes.STRING(30),
			allowNull: true,
		},
		rel_emcp: { // RELATIONSHIP OF EMERGENCY PERSON
			type: DataTypes.STRING(20),
			allowNull: true,
		},
		emc_n: { // EMERGENCY CONTACT NUMBER
			type: DataTypes.STRING(20),
			allowNull: true,
		},
		f_allergies: { // ALLERGIES TO FOOD
			type: DataTypes.TEXT,
			allowNull: true,
		},
		m_allergies: { // ALLERGIES TO MEDS
			type: DataTypes.TEXT,
			allowNull: true,
		},
		pers_hh: { // PERSONAL HEALTH HISTORY
			type: DataTypes.TEXT,
			allowNull: true,
		},
		imm_fam_hh: { // IMMEDIATE FAMILY HEALTH HISTORY
			type: DataTypes.TEXT,
			allowNull: true,
		},
		prev_medproc: { // PREVIOUS MEDICAL PROCEDURE
			type: DataTypes.TEXT,
			allowNull: true,
		},
		photo: {
			type: DataTypes.STRING
		},
		gen_notes: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		referred_by: {
			type: DataTypes.TEXT,
			allowNull: true
		},
		civil_status: {
			type: DataTypes.ENUM,
			values: civil_status_types,
			defaultValue: 'Single',
		},
		hmo: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		hmo_no: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		membership: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		expiration: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		company_name: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		insurance: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		prior_surgeries: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	});
}