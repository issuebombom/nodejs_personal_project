const jwt = require('jsonwebtoken');
// const cookieParser = require('cookie-parser');

// 토큰 검증을 위한 미들웨어
function authMiddleware(req, res, next) {
  // auth에서 access token을 획득합니다.
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer 제거
  if (token == null) return res.status(401).send({ msg: '엑세스 토큰을 입력해 주세요.' }); // 토큰이 없다면 종료

  // access token 검증
  jwt.verify(token, process.env.ACCESS_TOKEN_KEY, (err, user) => {
    // access token이 만료된 경우 재생성하기
    if (err) return res.status(403).send({ msg: '엑세스 토큰이 만료되었습니다.' });
    req.user = user;
    next();
  });
}

module.exports = authMiddleware;
