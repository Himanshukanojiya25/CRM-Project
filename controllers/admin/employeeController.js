const getEmployeePage = async (req, res) => {
  try {
    res.render('admin/employees/list'); // Later pass employee data here
  } catch (err) {
    console.error('Employee Page Error:', err);
    res.status(500).send('Server Error');
  }
};

module.exports = { getEmployeePage };
