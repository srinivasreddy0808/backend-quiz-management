const mongoose = require('mongoose');

// Custom validation function for array length
function arrayLengthValidator(val, allowedLengths) {
  return allowedLengths.includes(val.length);
}

// Custom validation function for options array length
function optionsLengthValidator(val) {
  return arrayLengthValidator(val, [2, 3, 4]);
}

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'text of the question must be specified'],
  },
  options: {
    type: [{ type: String }],
    required: [true, 'a question must have options'],
    validate: {
      validator: optionsLengthValidator,
      message: 'options array must contain 2, 3, or 4 items',
    },
  },
  type: {
    type: String,
    enum: ['single', 'poll'],
    required: [true, 'type of the question must be specified'],
  },
  optionsType: {
    type: String,
    enum: ['text', 'imageUrl', 'textAndImageUrl'],
  },
  timer: {
    type: Number, // Assuming timer is a number representing seconds
  },
  responseCounts: {
    type: [{ type: Number }],
    /* validate: {
      validator: responseCountsLengthValidator,
      message: 'responseCounts array must contain 1,2, 3, or 4 items',
    }, */
  },
  analytics: {
    answer: { type: String },
    attempts: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
  },
});

// Instance method to validate the submitted answer and update the correct count
questionSchema.methods.validateAnswerAndUpdate = async function (
  submittedAnswer,
) {
  const isCorrect = Number(this.analytics.answer) === Number(submittedAnswer);

  if (isCorrect) {
    // Increment correct count if the answer is correct
    this.analytics.correctAnswers += 1;
  }

  // Save the updated question
  await this.save();
  return isCorrect;
};

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;
