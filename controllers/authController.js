const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Send response to the client
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  console.log('signup reached');
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  console.log('new user', newUser);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  console.log('login reached');
  const { email, password } = req.body;
  // check  if email and password is exists
  if (!email || !password) {
    next(new AppError('please provide email and password ', 400));
  }
  // check if user exists and password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('incorrect email or password ', 401));
  }
  console.log('login ended');
  // if every thing is ok send token to the client as http only cookie
  createSendToken(user, 200, res);
});

// exports.protect = catchAsync(async (req, res, next) => {
//   // Getting token from cookies
//   const token = req.cookies.jwt;

//   if (!token) {
//     return next(
//       new AppError('You are not logged in. Please log in to get access.', 401),
//     );
//   }

//   // Verification of the token
//   const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

//   // Finding if the user exists
//   const currentUser = await User.findById(decoded.id);
//   if (!currentUser) {
//     return next(
//       new AppError('The user belonging to this token no longer exists.', 401),
//     );
//   }

//   // Granting access to protected route
//   req.user = currentUser;
//   next();
// });

exports.protect = catchAsync(async (req, res, next) => {
  console.log('protect reached');
  // getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('you are not logged in please login to get access', 401),
    );
  }
  // verification by the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // finding user exists or not
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('the usr belog to the token does no longer exist', 401),
    );
  }

  // access granted for protected route
  req.user = currentUser;
  next();
});
