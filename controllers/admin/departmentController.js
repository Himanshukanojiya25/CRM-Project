console.log('Controller verified as loaded!');

module.exports = {
  createDepartment: async (req, res) => {
    console.log('Create Department executed');
    res.json({ status: 'Department created' });
  },
  getAllDepartments: async (req, res) => {
    res.json([]);
  }
};