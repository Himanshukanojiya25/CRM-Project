'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('salary_slips', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            employeeId: {
                type: Sequelize.INTEGER,
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
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            // 🏠 Allowances
            houseRentAllowance: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            dearnessAllowance: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            medicalAllowance: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            conveyanceAllowance: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            specialAllowance: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            otherAllowances: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            totalAllowances: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            // 💸 Deductions
            providentFund: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            professionalTax: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            incomeTax: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            loanDeductions: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            otherDeductions: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            totalDeductions: {
                type: Sequelize.DECIMAL(12, 2),
                defaultValue: 0.00
            },
            // 💵 Totals
            grossSalary: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            netSalary: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            // 📅 Period & Payment
            monthYear: {
                type: Sequelize.STRING(7),
                allowNull: false
            },
            paymentDate: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            workingDays: {
                type: Sequelize.INTEGER,
                defaultValue: 26
            },
            presentDays: {
                type: Sequelize.INTEGER,
                defaultValue: 26
            },
            // 📄 Document Info
            pdfPath: {
                type: Sequelize.STRING(500),
                allowNull: true
            },
            pdfGeneratedAt: {
                type: Sequelize.DATE,
                allowNull: true
            },
            // 🏢 Company Details
            companyName: {
                type: Sequelize.STRING(255),
                defaultValue: 'VR Data Solutions'
            },
            companyAddress: {
                type: Sequelize.TEXT,
                defaultValue: '123 Business Park, Mumbai, Maharashtra - 400001'
            },
            companyLogo: {
                type: Sequelize.STRING(500),
                defaultValue: '/images/company-logo.png'
            },
            // 📊 Status & Tracking
            status: {
                type: Sequelize.ENUM('draft', 'processed', 'paid', 'cancelled'),
                defaultValue: 'processed'
            },
            paymentMethod: {
                type: Sequelize.ENUM('bank_transfer', 'cash', 'cheque', 'online'),
                defaultValue: 'bank_transfer'
            },
            transactionReference: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            remarks: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            // 👤 Audit Fields
            createdByAdminId: {
                type: Sequelize.INTEGER,
                allowNull: false
            },
            approvedByAdminId: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            version: {
                type: Sequelize.INTEGER,
                defaultValue: 1
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
        });

        // 🎯 Create indexes for performance
        await queryInterface.addIndex('salary_slips', ['employeeId', 'monthYear'], {
            unique: true,
            name: 'unique_employee_month'
        });
        
        await queryInterface.addIndex('salary_slips', ['monthYear']);
        await queryInterface.addIndex('salary_slips', ['status']);
        await queryInterface.addIndex('salary_slips', ['paymentDate']);
        await queryInterface.addIndex('salary_slips', ['createdAt']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('salary_slips');
    }
};