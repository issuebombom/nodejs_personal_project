const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../schemas/user');

const refreshRouter = express.Router();

refreshRouter.get('/', async (req, res) => {
  const cookies = req.cookies;
  // 쿠키가 없는 경우
  if (!cookies?.issuebombomCookie) return res.status(403).send({ 'msg': '찾는 쿠키 없음' });

  // 쿠키가 있으면
  const refreshToken = cookies.issuebombomCookie;
  // DB에 저장된 쿠키가 있는지 확인
  const user = User.findOne({ refreshToken });
  if (user == null) return res.status(403).send({ 'msg': '등록된 리프레시 토큰이 없음' });
  // 쿠키 검증
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, user) => {
    // refresh token이 만료된 경우 재로그인 안내
    if (err) return res.status(403).send({ 'msg': '리프레시 토큰이 만료됨 (재 로그인 필요)' });

    // 신규 토큰 생성
    const accessToken = jwt.sign({ userId: user.userId, password: user.password }, // 현재 user에는 토큰의 iat와 exp가 담겨있어 제외해야 한다.
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: '1m' }
    );
    // 재발급
    res.setHeader('Authorization', `Bearer ${accessToken}`);
    res.status(200).send({ msg: '토큰 재발급 완료' });
  });
});

module.exports = refreshRouter;