const express = require('express');
const postsRouter = express.Router();
const Post = require('../schemas/post');
const User = require('../schemas/user');

// 전체 포스트 확인(공개)
postsRouter.get('/', async (req, res) => {
  const getPosts = await Post.find({});
  res.send({ posts: getPosts });
});

// 유저별 포스트 확인(공개)
postsRouter.get('/:userId', async (req, res) => {
  const userId = req.params.userId;
  const user = await User.findOne({ userId }).populate('posts'); // 해당 유저의 포스트를 가져온다.
  if (!user) return res.status(401).send('해당하는 아이디가 없습니다.');
  res.send(user.posts);
});

module.exports = postsRouter;
