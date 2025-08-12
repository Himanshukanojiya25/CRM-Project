// controllers/admin/feedbackController.js

const Feedback = require('../../models/Feedback'); // ⚠️ Adjust if your model name/path is different

// GET all feedbacks
const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({});
    res.render('admin/feedbacks/index', { feedbacks }); // ⚠️ adjust path if view name is different
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).send('Internal Server Error');
  }
};

// DELETE a feedback by ID
const deleteFeedback = async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.redirect('/admin/feedbacks');
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  getAllFeedbacks,
  deleteFeedback,
};
