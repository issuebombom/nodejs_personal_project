const jwt = require('jsonwebtoken');
const User = require('../schemas/user');
const { getAccessToken, getRefreshToken } = require('../verification'); // 토큰 생성기

const login = async (req, res) => {
  const { username } = req.body;

  try {
    // 데이터베이스에서 유저 정보 조회
    const findUser = await User.findOne({ username });
    if (!findUser) return res.status(401).send({ msg: '회원이 아닙니다.' });

    // 토큰을 보내기 위해 만든 함수
    async function sendRefreshToken(refreshToken) {
      // refresh token 등록
      const update = { $set: { refreshToken } };
      await User.updateOne(findUser, update);

      // refresh token 쿠키로 전달
      res.cookie('issuebombomCookie', refreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 시간
      });
    }

    // 리프레시 토큰을 쿠키와 데이터베이스에 전달
    await sendRefreshToken(getRefreshToken(username, findUser.id));

    // 엑세스 토큰을 headers의 Authorization으로 보냄
    res.setHeader('Authorization', `Bearer ${getAccessToken(username, findUser._id)}`);

    res.status(200).send({ msg: '로그인 완료' });
  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ msg: `${err.message}` });
  }
};

module.exports = {
  login,
};
