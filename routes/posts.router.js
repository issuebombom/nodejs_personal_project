const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const postsController = require('../controllers/posts.controller');
const commentsController = require('../controllers/comments.controller');

const postsRouter = express.Router();

postsRouter.use(cookieParser());

// 전체 포스트 확인(공개)
postsRouter.get('/', postsController.getPosts);

// 포스트 작성
postsRouter.post('/',
  authMiddleware,
  postsController.writePosts);

// 내 게시글 수정 클릭 -> 비밀번호 확인 사이트로 이동(href에 게시글 id 전달) -> 비밀번호 검증 -> 수정페이지에서 수정
// 비밀번호 검증 페이지(쿼리값 필요)
postsRouter.post('/:postId/password-verification',
  authMiddleware,
  postsController.passwordVerificationForPosts);

// 수정페이지에서 수정완료(올리기) 클릭
postsRouter.put('/:postId',
  authMiddleware,
  postsController.editPosts);

// 포스트 삭제하기
postsRouter.delete('/:postId',
  authMiddleware,
  postsController.deletePosts);

// 포스트 댓글 확인(공개)
postsRouter.get('/:postId/comments', commentsController.getComments);

// 포스트 댓글 작성(회원 전용)
postsRouter.post('/:postId/comments',
  authMiddleware,
  commentsController.writeComments);

// 내 댓글 수정 클릭 -> 비밀번호 확인 사이트로 이동(href에 게시글 id 전달) -> 비밀번호 검증 -> 수정페이지에서 수정
// 비밀번호 검증 페이지(쿼리값 필요)
postsRouter.post('/:postId/comments/:commentId/password-verification',
  authMiddleware,
  commentsController.passwordVerificationForComments);

// 수정페이지에서 수정완료(올리기) 클릭
postsRouter.put('/:postId/comments/:commentId',
  authMiddleware,
  commentsController.editComments);

// 댓글 삭제하기
postsRouter.delete('/:postId/comments/:commentId',
  authMiddleware,
  commentsController.deleteComments);


// 토큰 검증을 위한 미들웨어
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


module.exports = postsRouter;
