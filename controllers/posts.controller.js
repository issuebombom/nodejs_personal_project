const Post = require('../schemas/post');
const User = require('../schemas/user');

// 전체 포스트 확인(공개)
const getPosts = async (req, res) => {
  try {
    const getPosts = await Post.find({}).sort({ _id: -1 }); // id 기준 내림차순정렬

    if (getPosts.length === 0) return res.send({ msg: '존재하는 게시글이 없습니다.' });
    res.send({ posts: getPosts });
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(403).send({ msg: `${err.message}` });
  }
};

// 포스트 작성
const writePosts = async (req, res) => {
  const { _id } = req.user;

  try {
    const findUser = await User.findById(_id);

    // find 결과가 null일 경우
    if (!findUser) return res.send({ msg: `데이터를 찾지 못했습니다.` });

    const { title, password, content } = req.body;
    const createdPost = await Post.create({ title, password, content, user: findUser._id });

    // 유저 정보에 유저가 올린 포스팅 정보를 담는다.
    const update = { $push: { posts: createdPost._id } };
    await User.updateOne({ _id: findUser._id }, update);
    res.json({ msg: '게시글 작성 완료' });
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

// 내 게시글 수정 클릭 -> 비밀번호 확인 사이트로 이동(href에 게시글 id 전달) -> 비밀번호 검증 -> 수정페이지에서 수정
// 비밀번호 검증 페이지(쿼리값 필요)
const passwordVerificationForPosts = async (req, res) => {
  const postId = req.params.postId;
  const password = req.body.password; // form 태그에서 받음

  try {
    const findPost = await Post.findById(postId);

    if (!findPost) return res.send({ msg: `데이터를 찾지 못했습니다.` });

    // 패스워드 일치 유무 확인
    if (password !== findPost.password)
      return res.status(403).send({ msg: '비밀번호가 일치하지 않습니다.' });
    res.send(findPost); // NOTE: 추후 삭제, 수정 기능과 연결 고려한 res 수정 필요
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

// 수정페이지에서 수정완료(올리기) 클릭
const editPosts = async (req, res) => {
  const postId = req.params.postId;
  const { title, password, content } = req.body;

  try {
    const findPost = await Post.findById(postId);

    // find 결과가 null일 경우
    if (!findPost) return res.send({ msg: `데이터를 찾지 못했습니다.` });

    // 수정일자 업데이트
    const update = { $set: { title, password, content, updatedAt: Date.now() } };
    await Post.updateOne(findPost, update);

    res.status(200).send({ msg: '게시글 수정 완료' });
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

// 포스트 삭제하기
const deletePosts = async (req, res) => {
  const _id = req.user._id;
  const postId = req.params.postId;

  try {
    const findUser = await User.findById(_id);
    const findPost = await Post.findById(postId);

    // find 결과가 null일 경우
    if (!findUser || !findPost) return res.send({ msg: `데이터를 찾지 못했습니다.` });

    // 유저 데이터에서 해당 포스트 id 제거 및 updatedAt 최신화
    const update = {
      $pull: { posts: postId },
      $set: { updatedAt: Date.now() },
    };
    await User.updateOne(findUser, update);

    // 포스트 삭제
    await Post.deleteOne(findPost);

    res.status(200).send({ msg: `게시글 삭제 완료 (${findPost._id})` });
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

module.exports = {
  getPosts,
  // getPostsByUserId,
  writePosts,
  passwordVerificationForPosts,
  editPosts,
  deletePosts,
};
