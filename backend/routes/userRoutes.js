import express from 'express';
import bcrypt from 'bcryptjs';
import expressAsyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { isAuth, isAdmin, generateToken, baseUrl, mailgun } from '../utils.js';
import logger from '../logger.js'; 


const userRouter = express.Router();

userRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    logger.info('Fetching all users', { admin: req.user._id });
    const users = await User.find({});
    logger.info(`Fetched ${users.length} users`);
    res.send(users);
  })
);


userRouter.get(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id;
    logger.info('Fetching user details', { userId });
    const user = await User.findById(userId);
    if (user) {
      logger.info('User details fetched', { userId });
      res.send(user);
    } else {
      logger.warn('User not found', { userId });
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.put(
  '/profile',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    logger.info('Updating user profile', { userId: req.user._id });
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }

      const updatedUser = await user.save();
      logger.info('User profile updated', { userId: req.user._id });
      res.send({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser),
      });
    } else {
      logger.warn('User not found for profile update', { userId: req.user._id });
      res.status(404).send({ message: 'User not found' });
    }
  })
);


userRouter.post(
  '/forget-password',
  expressAsyncHandler(async (req, res) => {
    const email = req.body.email;
    logger.info('Processing password reset request', { email });

    const user = await User.findOne({ email });
    if (user) {
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });
      user.resetToken = token;
      await user.save();

      logger.info('Password reset token generated', { userId: user._id });
      mailgun()
        .messages()
        .send(
          {
            from: 'Amazona <me@mg.yourdomain.com>',
            to: `${user.name} <${user.email}>`,
            subject: `Reset Password`,
            html: ` 
             <p>Please Click the following link to reset your password:</p> 
             <a href="${baseUrl()}/reset-password/${token}">Reset Password</a>
             `,
          },
          (error, body) => {
            if (error) {
              logger.error('Error sending password reset email', { error });
            } else {
              logger.info('Password reset email sent', { userId: user._id });
            }
          }
        );
      res.send({ message: 'We sent reset password link to your email.' });
    } else {
      logger.warn('User not found for password reset', { email });
      res.status(404).send({ message: 'User not found' });
    }
  })
);


userRouter.post(
  '/reset-password',
  expressAsyncHandler(async (req, res) => {
    jwt.verify(req.body.token, process.env.JWT_SECRET, async (err, decode) => {
      if (err) {
        logger.warn('Invalid reset token', { token: req.body.token });
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        const user = await User.findOne({ resetToken: req.body.token });
        if (user) {
          logger.info('Resetting password for user', { userId: user._id });
          if (req.body.password) {
            user.password = bcrypt.hashSync(req.body.password, 8);
            await user.save();
            logger.info('Password reset successfully', { userId: user._id });
            res.send({ message: 'Password reset successfully' });
          }
        } else {
          logger.warn('User not found for password reset', { token: req.body.token });
          res.status(404).send({ message: 'User not found' });
        }
      }
    });
  })
);

userRouter.post(
  '/reset-password',
  expressAsyncHandler(async (req, res) => {
    jwt.verify(req.body.token, process.env.JWT_SECRET, async (err, decode) => {
      if (err) {
        logger.warn('Invalid reset token', { token: req.body.token });
        res.status(401).send({ message: 'Invalid Token' });
      } else {
        const user = await User.findOne({ resetToken: req.body.token });
        if (user) {
          logger.info('Resetting password for user', { userId: user._id });
          if (req.body.password) {
            user.password = bcrypt.hashSync(req.body.password, 8);
            await user.save();
            logger.info('Password reset successfully', { userId: user._id });
            res.send({ message: 'Password reset successfully' });
          }
        } else {
          logger.warn('User not found for password reset', { token: req.body.token });
          res.status(404).send({ message: 'User not found' });
        }
      }
    });
  })
);


userRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const userId = req.params.id;
    logger.info('Deleting user', { userId });
    const user = await User.findById(userId);
    if (user) {
      if (user.email === 'admin@example.com') {
        logger.warn('Attempted to delete admin user', { userId });
        res.status(400).send({ message: 'Can Not Delete Admin User' });
        return;
      }
      await user.remove();
      logger.info('User deleted successfully', { userId });
      res.send({ message: 'User Deleted' });
    } else {
      logger.warn('User not found for deletion', { userId });
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.post(
  '/signin',
  expressAsyncHandler(async (req, res) => {
    const email = req.body.email;
    logger.info('User attempting to sign in', { email });
    const user = await User.findOne({ email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        logger.info('User signed in successfully', { userId: user._id });
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          token: generateToken(user),
        });
        return;
      }
    }
    logger.warn('Invalid email or password', { email });
    res.status(401).send({ message: 'Invalid email or password' });
  })
);

userRouter.post(
  '/signup',
  expressAsyncHandler(async (req, res) => {
    const newUser = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password),
    });
    const user = await newUser.save();
    res.send({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user),
    });
  })
);

export default userRouter;
