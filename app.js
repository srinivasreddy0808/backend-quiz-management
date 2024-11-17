const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const userRouter = require('./routes/userRoutes');
const quizRouter = require('./routes/quizRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
dotenv.config({ path: './config.env' });

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // Your frontend URL
    credentials: true, // This is important for cookies
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/users', userRouter);
app.use('/api/v1/quizzes', quizRouter);
app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
