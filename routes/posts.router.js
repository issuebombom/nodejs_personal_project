const express = require('express');
const jwt = require('jsonwebtoken');
const postsRouter = express.Router();
const cookieParser = require('cookie-parser');

const Post = require('../schemas/post');
const User = require('../schemas/user');
postsRouter.use(cookieParser());

// 포스트 확인용
// postsRouter.get('/', async (req, res) => {
//   const getPosts = await Post.find({});
//   res.send({ posts: getPosts });
// });

postsRouter.get('/', authMiddleware, async (req, res) => {
  // 유저의 _id를 가져와서 post에 입력해야 한다.
  const { userId, password } = req.user;
  const user = await User.findOne({ userId, password }).populate('posts'); // 해당 유저의 포스트를 가져온다.
  res.send(user);
});

postsRouter.post('/', authMiddleware, async (req, res) => {
  const { userId, password } = req.user;
  const findUser = await User.findOne({ userId, password });
  const { title, postPassword, content } = req.body;
  const createdPost = await Post.create({ title, postPassword, content, user: findUser._id });

  // 유저 정보에 유저가 올린 포스팅 정보를 담는다.
  const update = { $push: { posts: createdPost._id } };
  await User.updateOne({ _id: findUser._id }, update);
  res.json({ msg: '포스팅 완료' });
});

function authMiddleware(req, res, next) {
  // auth에서 access token을 획득합니다.
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer 제거
  if (token == null) return res.status(401).send({ 'msg': '엑세스 토큰을 입력해 주세요.' }); // 토큰이 없다면 종료

  // access token 검증
  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
    // access token이 만료된 경우 재생성하기
    if (err) return res.status(403).send({ 'msg': '엑세스 토큰이 만료되었습니다.'})
    req.user = user;
    next();
  });
};

module.exports = postsRouter;
