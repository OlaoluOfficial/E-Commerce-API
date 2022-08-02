const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User');
const { attachCookiesToResponse, createTokenUser } = require('../utils');

const register = async (req, res) => {
  const { email, name, password } = req.body;
  const isEmailAlreadyExists = await User.findOne({ email });
  if (isEmailAlreadyExists)
    throw new CustomError.BadRequestError('Email already exists');
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? 'admin' : 'user';
  const user = await User.create({ email, name, password, role });
  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({res, user: tokenUser})  
  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) 
    throw new CustomError.BadRequestError('Please provide email and password')
  const user = await User.findOne({email})
  if (!user) {
    throw new CustomError.UnauthenticatedError('Invalid credentials')
  }
  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid credentials')
  }
  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({res, user: tokenUser})  
  res.status(StatusCodes.OK).json({ user: tokenUser });};

const logout = (req, res) => {
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now())
  })
  res.status(StatusCodes.OK).json({msg: 'user logged out'});
};

module.exports = { register, login, logout };
