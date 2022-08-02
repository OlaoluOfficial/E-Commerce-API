const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const User = require('../models/User');
const { createTokenUser, attachCookiesToResponse } = require('../utils');
const checkPermissions = require('../utils/checkPermissions');

const getAllUsers = async (req, res) => {
  const user = await User.find({ role: 'user' }).select('-password');
  res.status(StatusCodes.OK).json({ user });
};

const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select('-password');
  if (!user)
    throw new CustomError.NotFoundError(`No user with id: ${req.params.id}`);
  checkPermissions(req.user, user._id)
  res.status(StatusCodes.OK).json({ user });
};

const showCurrentUser = (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

// update with user.save()
const updateUser = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    throw new CustomError.BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ _id: req.user.userId });
  user.email = email;
  user.name = name;
  await user.save();
  const tokenUser = createTokenUser(user);
  attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
  const { newPassword, oldPassword } = req.body;
  if (!newPassword || !oldPassword) {
    throw new CustomError.BadRequestError(
      'Please provide old password and new password'
    );
  }
  const user = await User.findOne({ _id: req.user.userId });
  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError('Invalid credentials');
  }
  user.password = newPassword;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Success! Password updated' });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};

// update with findOneAndUpdate
// const updateUser = async (req, res) => {
//   const { name, email } = req.body
//   if (!name || !email) {
//     throw new CustomError.BadRequestError('Please provide all values')
//   }
//   const user = await User.findOneAndUpdate({_id: req.user.userId}, {name, email}, {new: true, runValidators: true})
//   const tokenUser = createTokenUser(user)
//   attachCookiesToResponse({res, user: tokenUser})
//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };
