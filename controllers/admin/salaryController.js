const salaryController = {
    
    // 📊 Salary Dashboard
    salaryDashboard: async (req, res) => {
        try {
            console.log('💰 Salary Dashboard accessed by:', req.user.email);
            
            // Temporary data - database ready hone tak
            const dashboardData = {
                totalPaid: '2,45,000',
                employeesPaid: 15,
                pendingSalaries: 5,
                completionRate: 75,
                recentTransactions: [
                    {
                        employee: {
                            name: 'John Doe',
                            profilePhoto: '/images/default-avatar.png',
                            designation: 'Software Engineer'
                        },
                        monthYear: '2024-12',
                        netSalary: '45,000'
                    },
                    {
                        employee: {
                            name: 'Jane Smith', 
                            profilePhoto: '/images/default-avatar.png',
                            designation: 'HR Manager'
                        },
                        monthYear: '2024-12',
                        netSalary: '65,000'
                    },
                    {
                        employee: {
                            name: 'Mike Johnson',
                            profilePhoto: '/images/default-avatar.png', 
                            designation: 'Sales Executive'
                        },
                        monthYear: '2024-12',
                        netSalary: '38,000'
                    },
                    {
                        employee: {
                            name: 'Sarah Wilson',
                            profilePhoto: '/images/default-avatar.png',
                            designation: 'Marketing Manager'
                        },
                        monthYear: '2024-12',
                        netSalary: '52,000'
                    },
                    {
                        employee: {
                            name: 'David Brown',
                            profilePhoto: '/images/default-avatar.png',
                            designation: 'Product Designer'
                        },
                        monthYear: '2024-12', 
                        netSalary: '48,000'
                    }
                ]
            };

            res.render('admin/salary/dashboard', dashboardData);

        } catch (error) {
            console.error('❌ Dashboard Error:', error);
            res.render('admin/salary/dashboard', {
                totalPaid: '0',
                employeesPaid: 0,
                pendingSalaries: 0,
                completionRate: 0,
                recentTransactions: []
            });
        }
    },

    // 💰 Credit Salary Page
    creditSalaryPage: async (req, res) => {
        try {
            console.log('💳 Credit Salary page accessed by:', req.user.email);
            
            // Temporary employee data
            const employees = [
                {
                    id: 1,
                    name: 'John Doe',
                    employeeId: 'EMP001',
                    designation: 'Software Engineer',
                    currentSalary: 45000,
                    department: { name: 'Technology' }
                },
                {
                    id: 2,
                    name: 'Jane Smith',
                    employeeId: 'EMP002', 
                    designation: 'HR Manager',
                    currentSalary: 65000,
                    department: { name: 'Human Resources' }
                },
                {
                    id: 3,
                    name: 'Mike Johnson',
                    employeeId: 'EMP003',
                    designation: 'Sales Executive', 
                    currentSalary: 38000,
                    department: { name: 'Sales' }
                },
                {
                    id: 4,
                    name: 'Sarah Wilson',
                    employeeId: 'EMP004',
                    designation: 'Marketing Manager',
                    currentSalary: 52000,
                    department: { name: 'Marketing' }
                }
            ];

            res.render('admin/salary/credit-salary', {
                employees,
                selectedEmployeeId: req.query.employeeId || null
            });

        } catch (error) {
            console.error('❌ Credit Salary Page Error:', error);
            req.flash('error', 'Failed to load credit salary page');
            res.redirect('/admin/salary');
        }
    },

    // 💳 Process Salary Credit
    creditSalary: async (req, res) => {
        try {
            console.log('💳 Processing salary credit by:', req.user.email);
            
            const {
                employeeId,
                basicSalary,
                hra,
                da,
                otherAllowances,
                pf,
                tds,
                otherDeductions,
                month,
                year,
                paymentDate
            } = req.body;

            // Calculate totals
            const allowances = parseFloat(hra || 0) + parseFloat(da || 0) + parseFloat(otherAllowances || 0);
            const deductions = parseFloat(pf || 0) + parseFloat(tds || 0) + parseFloat(otherDeductions || 0);
            const netSalary = parseFloat(basicSalary || 0) + allowances - deductions;

            console.log('💰 Salary Calculated:', {
                basicSalary,
                allowances,
                deductions, 
                netSalary
            });

            // Temporary success message
            req.flash('success', `Salary of ₹${netSalary.toLocaleString('en-IN')} credited successfully!`);
            res.redirect('/admin/salary/history');

        } catch (error) {
            console.error('❌ Credit Salary Error:', error);
            req.flash('error', 'Failed to credit salary');
            res.redirect('/admin/salary/credit');
        }
    },

    // 👥 Employee List for Salary
    employeeList: async (req, res) => {
        try {
            console.log('👥 Employee Salary List accessed by:', req.user.email);
            
            // Temporary employee data
            const employees = [
                {
                    id: 1,
                    name: 'John Doe',
                    employeeId: 'EMP001',
                    designation: 'Software Engineer',
                    profilePhoto: '/images/default-avatar.png',
                    currentSalary: 45000,
                    attendanceRate: 95,
                    department: { name: 'Technology' },
                    salaryStatus: 'paid',
                    lastSalary: {
                        amount: 45000,
                        paymentDate: new Date('2024-12-01')
                    }
                },
                {
                    id: 2,
                    name: 'Jane Smith',
                    employeeId: 'EMP002',
                    designation: 'HR Manager', 
                    profilePhoto: '/images/default-avatar.png',
                    currentSalary: 65000,
                    attendanceRate: 98,
                    department: { name: 'Human Resources' },
                    salaryStatus: 'paid',
                    lastSalary: {
                        amount: 65000,
                        paymentDate: new Date('2024-12-01')
                    }
                },
                {
                    id: 3, 
                    name: 'Mike Johnson',
                    employeeId: 'EMP003',
                    designation: 'Sales Executive',
                    profilePhoto: '/images/default-avatar.png',
                    currentSalary: 38000,
                    attendanceRate: 92,
                    department: { name: 'Sales' },
                    salaryStatus: 'pending',
                    lastSalary: {
                        amount: 38000, 
                        paymentDate: new Date('2024-11-01')
                    }
                },
                {
                    id: 4,
                    name: 'Sarah Wilson',
                    employeeId: 'EMP004',
                    designation: 'Marketing Manager',
                    profilePhoto: '/images/default-avatar.png',
                    currentSalary: 52000,
                    attendanceRate: 96,
                    department: { name: 'Marketing' },
                    salaryStatus: 'paid',
                    lastSalary: {
                        amount: 52000,
                        paymentDate: new Date('2024-12-01')
                    }
                },
                {
                    id: 5,
                    name: 'David Brown',
                    employeeId: 'EMP005',
                    designation: 'Product Designer',
                    profilePhoto: '/images/default-avatar.png',
                    currentSalary: 48000,
                    attendanceRate: 94,
                    department: { name: 'Design' },
                    salaryStatus: 'pending',
                    lastSalary: {
                        amount: 48000,
                        paymentDate: new Date('2024-11-01')
                    }
                }
            ];

            res.render('admin/salary/employee-list', {
                employees: employees
            });

        } catch (error) {
            console.error('❌ Employee List Error:', error);
            res.render('admin/salary/employee-list', {
                employees: []
            });
        }
    },

    // 📜 Salary History
    salaryHistory: async (req, res) => {
        try {
            console.log('📜 Salary History accessed by:', req.user.email);
            
            // Temporary salary records
            const salaryRecords = [
                {
                    id: 1,
                    employee: {
                        name: 'John Doe',
                        employeeId: 'EMP001',
                        designation: 'Software Engineer',
                        profilePhoto: '/images/default-avatar.png',
                        department: { name: 'Technology' }
                    },
                    basicSalary: 45000,
                    allowances: 5000,
                    deductions: 2000,
                    netSalary: 48000,
                    monthYear: '2024-12',
                    paymentDate: new Date('2024-12-05'),
                    status: 'paid'
                },
                {
                    id: 2,
                    employee: {
                        name: 'Jane Smith',
                        employeeId: 'EMP002',
                        designation: 'HR Manager',
                        profilePhoto: '/images/default-avatar.png',
                        department: { name: 'Human Resources' }
                    },
                    basicSalary: 65000,
                    allowances: 8000,
                    deductions: 3000,
                    netSalary: 70000,
                    monthYear: '2024-12',
                    paymentDate: new Date('2024-12-05'),
                    status: 'paid'
                },
                {
                    id: 3,
                    employee: {
                        name: 'Sarah Wilson',
                        employeeId: 'EMP004',
                        designation: 'Marketing Manager',
                        profilePhoto: '/images/default-avatar.png',
                        department: { name: 'Marketing' }
                    },
                    basicSalary: 52000,
                    allowances: 6000,
                    deductions: 2500,
                    netSalary: 55500,
                    monthYear: '2024-12',
                    paymentDate: new Date('2024-12-05'),
                    status: 'paid'
                }
            ];

            // Statistics
            const totalPaid = salaryRecords.reduce((sum, record) => sum + record.netSalary, 0);
            const totalTransactions = salaryRecords.length;
            const employeesCount = 5; // Total employees
            const averageSalary = totalPaid / totalTransactions;

            res.render('admin/salary/history', {
                salaryRecords,
                totalPaid: Math.round(totalPaid),
                totalTransactions,
                employeesCount,
                averageSalary: Math.round(averageSalary),
                employees: [
                    { id: 1, name: 'John Doe' },
                    { id: 2, name: 'Jane Smith' },
                    { id: 3, name: 'Mike Johnson' },
                    { id: 4, name: 'Sarah Wilson' },
                    { id: 5, name: 'David Brown' }
                ],
                departments: [
                    { id: 1, name: 'Technology' },
                    { id: 2, name: 'Human Resources' },
                    { id: 3, name: 'Sales' },
                    { id: 4, name: 'Marketing' },
                    { id: 5, name: 'Design' }
                ],
                currentPage: 1,
                totalPages: 1
            });

        } catch (error) {
            console.error('❌ Salary History Error:', error);
            res.render('admin/salary/history', {
                salaryRecords: [],
                totalPaid: 0,
                totalTransactions: 0,
                employeesCount: 0,
                averageSalary: 0,
                employees: [],
                departments: [],
                currentPage: 1,
                totalPages: 1
            });
        }
    },

    // 📄 Download Salary Slip
    downloadSlip: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('📄 Downloading salary slip:', id);
            
            // Temporary implementation
            req.flash('info', 'PDF generation feature will be available soon');
            res.redirect('/admin/salary/history');

        } catch (error) {
            console.error('❌ Download Slip Error:', error);
            req.flash('error', 'Failed to download salary slip');
            res.redirect('/admin/salary/history');
        }
    },

    // 🔍 View Salary Details
    salaryDetails: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('🔍 Viewing salary details:', id);
            
            // Temporary implementation
            req.flash('info', 'Salary details feature will be available soon');
            res.redirect('/admin/salary/history');

        } catch (error) {
            console.error('❌ Salary Details Error:', error);
            req.flash('error', 'Failed to load salary details');
            res.redirect('/admin/salary/history');
        }
    }

};

module.exports = salaryController;