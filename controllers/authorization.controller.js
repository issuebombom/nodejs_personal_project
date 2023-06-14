const jwt = require('jsonwebtoken');
const User = require('../schemas/user');


const login = async (req, res) => {
  const { userId } = req.body;

  try {
    // 데이터베이스에서 유저 정보 조회
    const findUser = await User.findOne({ userId });
    if (!findUser) return res.status(401).send({ 'msg': '회원이 아닙니다.' });

    // 토큰 생성
    const accessToken = jwt.sign({ userId, _id: findUser._id },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: '30m' });
    const refreshToken = jwt.sign({ userId, _id: findUser._id },
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

  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ 'msg': `${err.message}` });
  }
};


// 리프레시 토큰으로 엑세스 토큰 발행
const refresh = async (req, res) => {

  try {
    const cookies = req.cookies;
    // 쿠키가 없는 경우
    if (!cookies?.issuebombomCookie) return res.status(403).send({ 'msg': '찾는 쿠키 없음' });

    // 쿠키가 있으면
    const refreshToken = cookies.issuebombomCookie;
    // DB에 저장된 쿠키가 있는지 확인
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).send({ 'msg': '등록된 리프레시 토큰이 없음' });
    // 쿠키 검증
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, user) => {
      // refresh token이 만료된 경우 재로그인 안내
      if (err) return res.status(403).send({ 'msg': '리프레시 토큰이 만료됨 (재 로그인 필요)' });

      // 신규 토큰 생성
      const accessToken = jwt.sign({ userId: user.userId, _id: user._id }, // 현재 user에는 토큰의 iat와 exp가 담겨있어 제외해야 한다.
        process.env.ACCESS_TOKEN_KEY,
        { expiresIn: '30m' }
      );
      // 재발급
      res.setHeader('Authorization', `Bearer ${accessToken}`);
      res.status(200).send({ msg: '토큰 재발급 완료' });
    });

  } catch (err) {
    console.error(err.name, ':', err.message);
    return res.status(500).send({ 'msg': `${err.message}` });
  }
};

module.exports = {
  login,
  refresh
};