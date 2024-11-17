const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'quiz must contains the title'],
  },
  createdAt: {
    type: Date,
    required: [true, 'date should be present'],
  },
  noOfImpressions: {
    type: Number,
    default: 0,
  },
  questions: {
    type: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Question',
      },
    ],
    validate: {
      validator: function (value) {
        return value.length <= 5 && value.length >= 1;
      },
      message:
        'questions should be more than or equal to one and less trhan or equal to 5',
    },
  },
});

quizSchema.methods.updateQuestions = async function (updatedQuestions) {
  // Map over the updatedQuestions to create an array of promises
  const updatePromises = updatedQuestions.map(async (updatedQuestion) => {
    // Find the corresponding question by ID
    const question = this.questions.id(updatedQuestion._id);

    if (!question) {
      throw new Error(`Question with ID ${updatedQuestion._id} not found`);
    }

    // Restrict changes to the question type and number of options
    if (
      updatedQuestion.type ||
      (updatedQuestion.options &&
        updatedQuestion.options.length !== question.options.length)
    ) {
      throw new Error(
        'Cannot update the type of the question or change the number of options',
      );
    }

    // Update the question's text
    if (updatedQuestion.text) {
      question.text = updatedQuestion.text;
    }

    // Update the timer if it's provided
    if (updatedQuestion.timer !== undefined) {
      question.timer = updatedQuestion.timer;
    }

    // Update the options content
    if (updatedQuestion.options) {
      question.options = question.options.map(
        (option, i) => updatedQuestion.options[i] || option,
      );
    }

    // Save the updated question
    return question.save();
  });

  // Wait for all update operations to complete
  await Promise.all(updatePromises);

  // Save the quiz instance (this will save any changes to the quiz itself)
  return this.save();
};

// Method to get quiz analytics
quizSchema.methods.getAnalytics = async function () {
  await this.populate('questions');

  return this; /* .questions.map((question) => ({
    questionId: question._id,
    attempts: question.analytics.attempts,
    correct: question.analytics.correctAnswers,
    incorrect: question.analytics.attempts - question.analytics.correctAnswers,
  })); */
};
const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;
