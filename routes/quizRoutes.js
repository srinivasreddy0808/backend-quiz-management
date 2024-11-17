const express = require('express');
const quizController = require('../controllers/quizController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/create-quiz')
  .post(authController.protect, quizController.createQuiz);
router
  .route('/update-quiz/:id')
  .put(authController.protect, quizController.updateQuiz);
router
  .route('/delete-quiz/:id')
  .delete(authController.protect, quizController.deleteQuiz);
router
  .route('/quiz-analytics/:quizId')
  .get(authController.protect, quizController.getQuizAnalytics);
// quiz details with the entire with array of questions id that referee by the quiz with quiz id populate with questions
router.route('/:quizId').get(quizController.getQuiz);
// question object with that is given by the quiz id and the and question id
router
  .route('/:quizId/questions/:questionId')
  .get(quizController.getQuestion)
  .post(quizController.postQuestion);

module.exports = router;
