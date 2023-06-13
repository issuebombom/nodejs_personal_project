const express = require('express');
const usersRouter = express.Router();

const User = require('../schemas/user');

// 유저 조회(API 확인용)
usersRouter.get('/', async (req, res) => {
  const getUsers = await User.find({});

  res.send({ users: getUsers });
});

// sign-up
usersRouter.post('/', async (req, res) => {
  const { userId, password } = req.body;

  // 고유값에 대한 검증을 합니다.
  const findUser = await User.find({ userId });
  if (findUser.length !== 0) {
    res.sendStatus(400);
  }

  // 계정 생성
  const createdUser = await User.create({ userId, password });
  res.send({ msg: '유저 등록 완료' });
});

module.exports = usersRouter;