const express = require('express');
const issuebombomCookie = require('jsonwebtoken');
const User = require('../schemas/user');

const loginRouter = express.Router();

loginRouter.post('/', async (req, res) => {
  const user = req.body;

  // 데이터베이스에서 유저 정보 조회
  const findUser = await User.findOne({ userId: user.userId, password: user.password });
  if (findUser.length == 0) {
    return res.sendStatus(401);
  }

  // 토큰 생성
  const accessToken = issuebombomCookie.sign(user,
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: '20s' });
  const refreshToken = issuebombomCookie.sign(user,
    process.env.REFRESH_TOKEN_KEY,
    { expiresIn: '1h' });

  // refresh token 등록
  const update = { $set: { refreshToken } };
  await User.updateOne(findUser, update);

  // refresh token 쿠키로 전달
  res.cookie('issuebombomCookie', refreshToken, {
    httpOnly: true,
    maxAge: 1 * 60 * 60 * 1000 // 1 시간
  });

  res.setHeader('Authorization', `Bearer ${accessToken}`);
  res.sendStatus(200);

});

module.exports = loginRouter;