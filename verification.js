const jwt = require('jsonwebtoken');
const User = require('./schemas/user');

// 엑세스 토큰 생성기
const getAccessToken = ((username, _id) => {
  const accessToken = jwt.sign({ username, _id }, process.env.ACCESS_TOKEN_KEY, {
    expiresIn: '30m',
  });
  return () => accessToken;
})();

// 리프레시 토큰 생성기
const getRefreshToken = ((username, _id) => {
  const refreshToken = jwt.sign({ username, _id }, process.env.REFRESH_TOKEN_KEY, {
    expiresIn: '30m',
  });
  return () => refreshToken;
})();

// 엑세스 토큰 검증을 위한 미들웨어
function verifyAccessToken(req, res, next) {
  // auth에서 access token을 획득합니다.
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer 제거
  if (!token) return res.status(401).send({ msg: '엑세스 토큰을 입력해 주세요.' }); // 토큰이 없다면 종료

  // access token 검증
  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
    // access token이 만료된 경우 재생성하기
    if (err) {
      req.expired = true;
      console.error(err.name, ':', err.message);
    }
    req.user = user;
    next();
  });
}

// 엑세스 토큰 만료 시 재발급을 위한 미들웨어
async function replaceAccessToken(req, res, next) {
  if (req.expired) {
    try {
      const cookies = req.cookies;
      // 쿠키가 없는 경우
      if (!cookies?.issuebombomCookie)
        return res.status(403).send({ msg: '엑세스 토큰 재발급을 위한 쿠키 없음' });

      // 쿠키가 있으면
      const refreshToken = cookies.issuebombomCookie;
      // DB에 저장된 쿠키가 있는지 확인
      const user = await User.findOne({ refreshToken });
      if (!user) return res.status(403).send({ msg: '해당 쿠키에는 등록된 리프레시 토큰이 없음' });
      // 쿠키 검증
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY, (err, user) => {
        // refresh token이 만료된 경우 재로그인 안내
        if (err) return res.status(403).send({ msg: '리프레시 토큰이 만료됨 (재 로그인 필요)' });

        // 신규 토큰 생성 및 재발급
        res.setHeader('Authorization', `Bearer ${getAccessToken(user.username, user._id)}`);
        res.status(200).send({ msg: '엑세스 토큰이 만료되어 재발급' });
      });
    } catch (err) {
      console.error(err.name, ':', err.message);
      return res.status(500).send({ msg: `${err.message}` });
    }
  } else {
    next();
  }
}

module.exports = {
  getAccessToken,
  getRefreshToken,
  verifyAccessToken,
  replaceAccessToken,
};
