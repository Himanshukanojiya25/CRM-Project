const Feedback = require('../../models/Feedback');
const sendEmail = require('../../utils/emailSender');

// ✅ POST /user/feedback - Submit Feedback
const submitFeedback = async (req, res) => {
  try {
    const { message } = req.body;

    // 🔒 Validate input
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Feedback message cannot be empty.',
      });
    }

    // 📝 Create and save feedback
    const feedback = await Feedback.create({
      user: req.user._id,
      message: message.trim(),
    });

    console.log(`🟢 Feedback submitted by User ID: ${req.user._id}`);

    // 📧 Send Email Notification to Admin
    await sendEmail({
      to: 'himanshukanojiya27@gmail.com',
      subject: '📩 New Feedback Submitted',
      text: `User ID: ${req.user._id} submitted feedback: ${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>📝 New Feedback Received</h2>
          <p><strong>User ID:</strong> ${req.user._id}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f0f0f0; padding: 10px; border-left: 5px solid #ccc;">${message}</blockquote>
        </div>
      `,
    });

    res.status(201).json({
      success: true,
      message: '✅ Feedback submitted successfully.',
      data: feedback,
    });
  } catch (error) {
    console.error('❌ Error in submitFeedback:', error.message);
    res.status(500).json({
      success: false,
      message: '⚠️ Server error while submitting feedback.',
    });
  }
};

// ✅ GET /user/feedbacks - Get feedbacks of logged-in user
const getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: '📄 Feedbacks fetched successfully.',
      data: feedbacks,
    });
  } catch (error) {
    console.error('❌ Error in getMyFeedbacks:', error.message);
    res.status(500).json({
      success: false,
      message: '⚠️ Server error while fetching feedbacks.',
    });
  }
};

// ✅ Export both
module.exports = {
  submitFeedback,
  getMyFeedbacks,
};
