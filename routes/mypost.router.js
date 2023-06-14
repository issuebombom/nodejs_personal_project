const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const Post = require('../schemas/post');
const User = require('../schemas/user');

const myPostRouter = express.Router();
myPostRouter.use(cookieParser());


// 내 포스트 확인(본인만 가능)
myPostRouter.get('/', authMiddleware, async (req, res) => {
  const { userId } = req.user;
  const user = await User.findOne({ userId }).populate('posts');
  if (user.posts.length === 0) return res.send({ 'msg': '게시글이 없습니다.' });
  res.send(user.posts);
});

// 포스트 작성
myPostRouter.post('/', authMiddleware, async (req, res) => {
  const { userId, password } = req.user;
  const findUser = await User.findOne({ userId, password });
  const { title, postPassword, content } = req.body;
  const createdPost = await Post.create({ title, postPassword, content, user: findUser._id });

  // 유저 정보에 유저가 올린 포스팅 정보를 담는다.
  const update = { $push: { posts: createdPost._id } };
  await User.updateOne({ _id: findUser._id }, update);
  res.json({ msg: '포스팅 완료' });
});

// 내 게시글 수정 클릭 -> 비밀번호 확인 사이트로 이동(href에 쿼리로 게시글 id 전달) -> 비밀번호 검증 -> 수정페이지에서 수정
// 비밀번호 검증 페이지
myPostRouter.post('/verify', async (req, res) => {
  const postId = req.query.postId;
  const postPassword = req.body.password;

  // NOTE: 패스워드 부분 확인 필요

  const findPost = await Post.findById(postId);
  if (postPassword !== findPost.postPassword) return res.status(403).send({ 'msg': '비밀번호가 일치하지 않습니다.' });

  res.send(findPost);
});

// 수정페이지에서 수정완료(올리기) 클릭
myPostRouter.put('/:postId', async (req, res) => {
  const postId = req.params.postId;
  const { title, postPassword, content } = req.body;
  const findPost = Post.findById(postId);

  const update = { '$set': { title, postPassword, content, updatedAt: Date.now() } };
  await Post.updateOne(findPost, update);

  res.status(200).send({ 'msg': '게시글 수정 완료' });
});

function authMiddleware(req, res, next) {
  // auth에서 access token을 획득합니다.
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer 제거
  if (token == null) return res.status(401).send({ 'msg': '엑세스 토큰을 입력해 주세요.' }); // 토큰이 없다면 종료

  // access token 검증
  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
    // access token이 만료된 경우 재생성하기
    if (err) return res.status(403).send({ 'msg': '엑세스 토큰이 만료되었습니다.' });
    req.user = user;
    next();
  });
};

module.exports = myPostRouter;