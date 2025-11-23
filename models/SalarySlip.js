const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const SalarySlip = sequelize.define('SalarySlip', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        // 💰 Salary Components
        basicSalary: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00,
            validate: {
                min: 0
            }
        },
        // 🏠 Allowances
        houseRentAllowance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        dearnessAllowance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        medicalAllowance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        conveyanceAllowance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        specialAllowance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        otherAllowances: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        totalAllowances: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        // 💸 Deductions
        providentFund: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        professionalTax: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        incomeTax: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        loanDeductions: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        otherDeductions: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        totalDeductions: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        // 💵 Totals
        grossSalary: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        netSalary: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0.00,
            validate: { min: 0 }
        },
        // 📅 Period & Payment
        monthYear: {
            type: DataTypes.STRING(7), // Format: '2024-12'
            allowNull: false,
            validate: {
                is: /^\d{4}-\d{2}$/
            }
        },
        paymentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        workingDays: {
            type: DataTypes.INTEGER,
            defaultValue: 26,
            validate: { min: 1, max: 31 }
        },
        presentDays: {
            type: DataTypes.INTEGER,
            defaultValue: 26,
            validate: { min: 0, max: 31 }
        },
        // 📄 Document Info
        pdfPath: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        pdfGeneratedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        // 🏢 Company Details (for PDF)
        companyName: {
            type: DataTypes.STRING(255),
            defaultValue: 'VR Data Solutions'
        },
        companyAddress: {
            type: DataTypes.TEXT,
            defaultValue: '123 Business Park, Mumbai, Maharashtra - 400001'
        },
        companyLogo: {
            type: DataTypes.STRING(500),
            defaultValue: '/images/company-logo.png'
        },
        // 📊 Status & Tracking
        status: {
            type: DataTypes.ENUM('draft', 'processed', 'paid', 'cancelled'),
            defaultValue: 'processed'
        },
        paymentMethod: {
            type: DataTypes.ENUM('bank_transfer', 'cash', 'cheque', 'online'),
            defaultValue: 'bank_transfer'
        },
        transactionReference: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        // 👤 Audit Fields
        createdByAdminId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        approvedByAdminId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    }, {
        tableName: 'salary_slips',
        indexes: [
            {
                fields: ['employeeId', 'monthYear'],
                unique: true,
                name: 'unique_employee_month'
            },
            {
                fields: ['monthYear']
            },
            {
                fields: ['status']
            },
            {
                fields: ['paymentDate']
            },
            {
                fields: ['createdAt']
            }
        ],
        hooks: {
            beforeSave: (salarySlip, options) => {
                // 🧮 Auto-calculate totals before saving
                if (salarySlip.changed('basicSalary') || 
                    salarySlip.changed('houseRentAllowance') ||
                    salarySlip.changed('dearnessAllowance') ||
                    salarySlip.changed('medicalAllowance') ||
                    salarySlip.changed('conveyanceAllowance') ||
                    salarySlip.changed('specialAllowance') ||
                    salarySlip.changed('otherAllowances')) {
                    
                    salarySlip.totalAllowances = (
                        parseFloat(salarySlip.houseRentAllowance || 0) +
                        parseFloat(salarySlip.dearnessAllowance || 0) +
                        parseFloat(salarySlip.medicalAllowance || 0) +
                        parseFloat(salarySlip.conveyanceAllowance || 0) +
                        parseFloat(salarySlip.specialAllowance || 0) +
                        parseFloat(salarySlip.otherAllowances || 0)
                    );
                }

                if (salarySlip.changed('providentFund') || 
                    salarySlip.changed('professionalTax') ||
                    salarySlip.changed('incomeTax') ||
                    salarySlip.changed('loanDeductions') ||
                    salarySlip.changed('otherDeductions')) {
                    
                    salarySlip.totalDeductions = (
                        parseFloat(salarySlip.providentFund || 0) +
                        parseFloat(salarySlip.professionalTax || 0) +
                        parseFloat(salarySlip.incomeTax || 0) +
                        parseFloat(salarySlip.loanDeductions || 0) +
                        parseFloat(salarySlip.otherDeductions || 0)
                    );
                }

                // Calculate gross and net salary
                salarySlip.grossSalary = (
                    parseFloat(salarySlip.basicSalary || 0) + 
                    parseFloat(salarySlip.totalAllowances || 0)
                );

                salarySlip.netSalary = (
                    parseFloat(salarySlip.grossSalary || 0) - 
                    parseFloat(salarySlip.totalDeductions || 0)
                );
            }
        }
    });

    // 🔗 Associations
    SalarySlip.associate = function(models) {
        SalarySlip.belongsTo(models.User, {
            foreignKey: 'employeeId',
            as: 'employee',
            onDelete: 'CASCADE'
        });
        
        SalarySlip.belongsTo(models.User, {
            foreignKey: 'createdByAdminId',
            as: 'createdByAdmin'
        });
        
        SalarySlip.belongsTo(models.User, {
            foreignKey: 'approvedByAdminId',
            as: 'approvedByAdmin'
        });
    };

    // 📊 Instance Methods
    SalarySlip.prototype.toJSON = function() {
        const values = Object.assign({}, this.get());
        
        // Format decimal values
        const decimalFields = [
            'basicSalary', 'houseRentAllowance', 'dearnessAllowance', 
            'medicalAllowance', 'conveyanceAllowance', 'specialAllowance',
            'otherAllowances', 'totalAllowances', 'providentFund', 
            'professionalTax', 'incomeTax', 'loanDeductions', 
            'otherDeductions', 'totalDeductions', 'grossSalary', 'netSalary'
        ];
        
        decimalFields.forEach(field => {
            if (values[field]) {
                values[field] = parseFloat(values[field]);
            }
        });

        return values;
    };

    // 🔍 Class Methods
    SalarySlip.getEmployeeSalaryHistory = function(employeeId, limit = 12) {
        return this.findAll({
            where: { employeeId },
            order: [['monthYear', 'DESC']],
            limit,
            include: ['employee']
        });
    };

    SalarySlip.getMonthlyReport = function(monthYear) {
        return this.findAll({
            where: { monthYear },
            include: [{
                association: 'employee',
                include: ['Department']
            }],
            order: [['employee', 'name', 'ASC']]
        });
    };

    return SalarySlip;
};