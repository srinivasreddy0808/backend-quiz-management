const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Quiz = require('./quizModel');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'please provide your name'],
  },
  email: {
    type: String,
    required: [true, 'please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please provide your valid email'],
  },
  password: {
    type: String,
    required: [true, 'please provide hashed password'],
    select: false,
  },
  quizzes: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Quiz',
    },
  ],
});

userSchema.methods.getDashboardData = async function () {
  const user = this; // `this` refers to the current user document
  console.log(user.quizzes);
  // Fetch quizzes and populate questions
  const quizzes = await Quiz.find({ _id: { $in: user.quizzes } }).populate(
    'questions',
  );
  console.log(quizzes, 'quizzes');

  // Calculate number of quizzes
  const noOfQuizzes = quizzes.length;

  // Calculate number of questions
  const noOfQuestions = quizzes.reduce(
    (count, quiz) => count + quiz.questions.length,
    0,
  );

  // Calculate total impressions
  const totalImpressions = quizzes.reduce(
    (sum, quiz) => sum + quiz.noOfImpressions,
    0,
  );

  // Filter quizzes with more than 10 impressions and format details
  const quizDetails = quizzes
    .filter((quiz) => quiz.noOfImpressions > 10)
    .map((quiz) => ({
      title: quiz.title,
      createdAt: quiz.createdAt,
      noOfImpressions: quiz.noOfImpressions,
    }));

  return {
    noOfQuizzes,
    noOfQuestions,
    totalImpressions,
    quizDetails,
  };
};
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
const User = mongoose.model('User', userSchema);

module.exports = User;
