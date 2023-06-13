const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../schemas/user');

const loginRouter = express.Router();

loginRouter.post('/', async (req, res) => {
  const user = req.body;

  // 데이터베이스에서 유저 정보 조회
  const findUser = await User.findOne({ userId: user.userId });
  if (!findUser) {
    return res.status(401).send({ 'msg': '회원이 아닙니다.' });
  }

  // 토큰 생성
  const accessToken = jwt.sign(user,
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: '1m' });
  const refreshToken = jwt.sign(user,
    process.env.REFRESH_TOKEN_KEY,
    { expiresIn: '1d' });

  // refresh token 등록
  const update = { $set: { refreshToken } };
  await User.updateOne(findUser, update);

  // refresh token 쿠키로 전달
  res.cookie('issuebombomCookie', refreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 시간
  });

  res.setHeader('Authorization', `Bearer ${accessToken}`);
  res.status(200).send({ msg: '로그인 완료' });
});

module.exports = loginRouter;