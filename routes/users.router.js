const express = require('express');
const usersRouter = express.Router();

const User = require('../schemas/user');

usersRouter.get('/', async (req, res) => {
  const getUsers = await User.find({});

  res.json({ users: getUsers });
});

usersRouter.post('/', async (req, res) => {
  const { userId, password } = req.body;

  const createdUser = await User.create({ userId, password });

  res.send({ msg: '유저 등록 완료' });
});

module.exports = usersRouter;