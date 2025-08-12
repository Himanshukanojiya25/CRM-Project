exports.addPerformance = async (req, res) => {
  const { employeeId, attendance, tasksCompleted, productivity } = req.body;

  await Performance.create({
    userId: employeeId,
    metrics: { attendance, tasksCompleted, productivity },
    reviewedBy: req.user._id // Logged-in admin
  });

  res.redirect('/admin/performance');
};