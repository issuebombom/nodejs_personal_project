const User = require('../schemas/user');

// 유저 조회(API 확인용)
const getUsers = async (req, res) => {
  try {
    const findUsers = await User.find({});
    if (findUsers.length === 0) return res.send({ msg: '유저 정보가 없습니다.' });

    res.send(findUsers);
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

// 유저 조회(개인별)
const getUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const findUser = await User.findById(userId);
    if (!findUser) return res.send({ msg: '유저 정보가 없습니다.' });

    res.send(findUser);
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

// 유저별 포스트 확인
const getPostsByUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await User.findById(userId).populate('posts'); // 해당 유저의 포스트를 가져온다.
    if (!user) return res.send({ msg: '유저 정보가 없습니다.' });
    if (user.posts.length === 0) return res.send({ msg: '해당 유저는 작성한 포스트가 없습니다.' });

    res.send(user.posts);
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

// sign-up
const signUp = async (req, res) => {
  const { username, password } = req.body;

  try {
    const findUser = await User.findOne({ username });

    // 고유값에 대한 검증을 합니다.
    if (findUser) return res.status(400).send({ msg: '해당 아이디가 이미 존재합니다.' });

    // 계정 생성
    await User.create({ username, password });
    res.send({ msg: '유저 등록 완료' });
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

module.exports = {
  getUsers,
  getUser,
  getPostsByUser,
  signUp,
};
