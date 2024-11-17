const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');

exports.dashboard = catchAsync(async (req, res) => {
  const userId = req.user._id; // Assumes userId is available from authentication middleware

  // Fetch user and get dashboard data
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const dashboardData = await user.getDashboardData();

  return res.status(200).json({
    status: 'success',
    data: dashboardData,
  });
});

exports.getUserAnalytics = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // Assuming you have user authentication middleware that sets `req.user`

  // Fetch the user and populate the quizzes (without populating questions)
  const user = await User.findById(userId).populate({
    path: 'quizzes',
    populate: {
      path: 'questions', // Fully populate the questions within each quiz
      select: '', // Include all fields in the question objects
    }, // Exclude questions from the populated quizzes
  });

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'User not found',
    });
  }

  // Respond with all user fields and populated quizzes
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
