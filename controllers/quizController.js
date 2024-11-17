const Quiz = require('../models/quizModel');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const Question = require('../models/questionModel');

exports.createQuiz = catchAsync(async (req, res, next) => {
  /* console.log('create quiz is called');
  console.log(req.body.questions[0].analytics);
  console.log(req.body.questions); */

  // Step 1: Create Question documents and collect their IDs
  const questionDocs = await Question.create(req.body.questions); // Creates the questions and saves them to the DB
  const questionIds = questionDocs.map((question) => question._id); // Extracts the IDs of the created questions

  // Step 2: Create Quiz document using the question IDs
  const quiz = await Quiz.create({
    title: req.body.title,
    createdAt: req.body.createdAt,
    questions: questionIds, // Using question IDs instead of objects
  });

  // Step 3: Find the user and update the quizzes array
  await User.findByIdAndUpdate(
    req.user._id, // Assuming the user ID is available in req.user._id after authentication
    { $push: { quizzes: quiz._id } }, // Push the new quiz ID into the quizzes array
    { new: true, runValidators: true }, // Return the updated document
  );

  res.status(201).json({
    status: 'success',
    data: {
      quiz,
    },
  });
});

exports.updateQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params; // The quiz ID from the request parameters
  const { questions } = req.body; // Extract questions array from the request body

  // Fetch the quiz by ID and populate its questions
  const quiz = await Quiz.findById(id).populate('questions');

  if (!quiz) {
    return res.status(404).json({
      status: 'fail',
      message: 'No quiz found with that ID',
    });
  }

  // Ensure the incoming questions array length matches the quiz's questions array length
  if (questions && questions.length === quiz.questions.length) {
    // Traverse the questions array in the Quiz document and update fields from incoming questions
    const questionPromises = quiz.questions.map(async (question, index) => {
      const questionData = questions[index]; // Get the corresponding question data by index

      // Update fields if provided in the incoming question data
      if (questionData.text) {
        question.text = questionData.text;
      }
      if (questionData.options) {
        question.options = questionData.options;
      }
      if (questionData.timer !== undefined) {
        question.timer = questionData.timer;
      }

      // Save the updated question
      await question.save();
    });

    // Wait for all question updates to complete
    await Promise.all(questionPromises);
  } else {
    return res.status(400).json({
      status: 'fail',
      message: 'Mismatch between quiz questions and incoming questions count.',
    });
  }

  // Save the updated quiz document
  await quiz.save();

  // Respond with the updated quiz data
  res.status(200).json({
    status: 'success',
    data: {
      quiz,
    },
  });
});

exports.deleteQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  /* console.log('delete quiz reached'); */

  // Find the quiz by ID
  const quiz = await Quiz.findById(id);

  if (!quiz) {
    return res.status(404).json({
      status: 'fail',
      message: `No quiz found with ID ${id}`,
    });
  }

  // Find the user associated with the quiz
  const user = await User.findOne({ quizzes: id });

  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: `No user found associated with quiz ID ${id}`,
    });
  }

  // Remove the quiz reference from the user
  user.quizzes.pull(id);
  await user.save();

  // Delete associated questions
  await Question.deleteMany({ _id: { $in: quiz.questions.map((q) => q._id) } });

  // Delete the quiz
  await Quiz.deleteOne({ _id: id });

  res.status(204).json({
    status: 'success',
    message: 'Quiz successfully deleted',
  });
});

exports.getQuizAnalytics = catchAsync(async (req, res, next) => {
  const { quizId } = req.params;

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    return res.status(404).json({
      status: 'fail',
      message: 'Quiz not found',
    });
  }

  const data = await quiz.getAnalytics();

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getQuiz = catchAsync(async (req, res, next) => {
  const { quizId } = req.params;

  // Find the quiz by ID and populate the questions
  const quiz = await Quiz.findById(quizId).populate('questions');

  if (!quiz) {
    return res.status(404).json({
      status: 'fail',
      message: 'Quiz not found',
    });
  }

  // Increment the noOfImpressions by 1
  quiz.noOfImpressions += 1;

  // Save the updated quiz document
  await quiz.save();

  res.status(200).json({
    status: 'success',
    data: {
      quiz,
    },
  });
});

// Function to get a specific question by quizId and questionId
exports.getQuestion = catchAsync(async (req, res, next) => {
  const { quizId, questionId } = req.params;

  // Find the quiz by ID and populate the questions
  const quiz = await Quiz.findById(quizId).populate('questions');

  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  // Find the specific question by questionId
  const question = quiz.questions.find((q) => q._id.toString() === questionId);

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }

  // Increment the analytics.attempts count by 1
  if (question.type === 'single') {
    question.analytics.attempts += 1;
    await question.save();
  }

  // Return the question
  res.status(200).json({
    status: 'success',
    data: {
      question,
    },
  });
});

// Function to handle POST request to validate and update the answer
exports.postQuestion = catchAsync(async (req, res, next) => {
  /*   console.log('post question reached');
   */ const { quizId, questionId } = req.params;
  const { selectedOption: answer } = req.body; // Extract the submitted answer from the request body

  // Find the quiz and populate its questions
  const quiz = await Quiz.findById(quizId).populate('questions');

  if (!quiz) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  // Find the specific question by ID
  const question = quiz.questions.find((q) => q._id.toString() === questionId);

  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  let isCorrect;
  // Validate the answer and update analytics using the instance method
  if (question.type === 'single') {
    isCorrect = await question.validateAnswerAndUpdate(answer);
  } else {
    // Update the response count for the selected option
    question.responseCounts[answer] =
      (question.responseCounts[answer] || 0) + 1; // Increment or initialize to 1 if not already set
    await question.save(); // Save the updated question to persist the changes
  }
  /* console.log(isCorrect, 'iscorrect'); */
  // Respond with the updated analytics of the question
  res.status(200).json({
    status: 'success',
    data: {
      questionId: question._id,
      attempts: question.analytics.attempts,
      correct: question.analytics.correctAnswers,
      isCorrect,
    },
  });
});
