# nodejs_personal_project
## 개요
위 프로젝트를 통해 서버용 데이터베이스 환경 구축하고, 이를 토대로 게시글과 관련해서 CRUD를 간단하게 구현해본다.

## 필수 진행 사항
### MongoDB 생성 및 mongoose 다루기
내 PC를 mongoDB 데이터베이스 관리를 위한 서버로서 활용하기 위해 아래 내역을 설치한다.  

```zsh
# brew에서 mongodb-community 설치
brew tap mongodb/brew
brew install mongodb-community
```

설치가 완료되면 mongodb를 실행한다.
```zsh
brew services start mongodb-community

# 종료는 stop
# brew services start mongodb-community
```

위 과정이 끝나면 npm 패키지로 mongoose도 설치해 준다.
```zsh
npm install mongoose
```

### 디렉토리 Path 설정
초기에는 `schemas`와 `routes` 폴더를 생성하여 task를 분류한다. `schemas`의 경우 mongoDB connection과 schema를 관리하고, `routes`는 API method에 따른 req, res 명령을 관리한다.  

추후에는 MVC 패턴을 적용하여 route에서 controllers로 확장할 수 있다. 

### mongoDB Connect
```javascript
// ./schemas/index.js
const mongoose = require('mongoose');

const connect = () => {
  mongoose
    .connect('mongodb://localhost:27017/myDatabase') // 자동으로 데이터 베이스 신규 생성 됨을 확인
    .catch(err => console.log(err));
};

mongoose.connection.on('connected', () => {
  console.log('mongoDB connected')
});

mongoose.connection.on('error', err => {
  console.error("connection error", err);
});

module.exports = connect;
```
강의에서는 위 코드를 제공하며 복붙하고 쓸 것을 요청한다. 하지만 이 코드만 던져주면 여러 의문점이 생겨서 몇가지 확인했다.
1. 설치 이후 데이터베이스 생성을 한 적이 없는데 myDatabase로 어떻게 접근이 가능한 건가?
-> mongoDB에 접속 시 myDatabase란에 입력된 값이 데이터 리스트 목록에 없다면 신규 생성하고, 있다면 기존 데이터베이스를 자동으로 가져온다. 이는 터미널에서 `mongosh` 명령을 통해 확인할 수 있었다. mongosh에 들어가면 mongodb를 위한 shell이 활성화 되는데 이 곳에서 `show databases`를 입력하면 지금까지 생성된 데이터베이스를 확인할 수 있다. 위 코드에서 connect 함수가 실행되는 순간 생성된 것이다.    
2. `mongoose.connection.on`은 뭐하는 메서드인가?  
-> mongoDB 커넥션 상태에 대한 이벤트 리스너였다. `error` 데이터베이스의 연결 에러 발생에 대한 이벤트 리스너였다. error 말고도 connected, disconnected, close 등 몇몇 더 있다. 해당 이벤트리스너는 해당 코드가 기록된 js 파일이 require되는 순간 실행되므로 사전에 이벤트가 등록된다.  그러므로 로깅을 위한 용도로 활용할 수 있겠다.  
3. 어차피 이벤트리스너로 connection error에 대한 경고 코드가 작성되어 있는데 왜 굳이 connect 함수에서 catch를 사용하여 에러에 대한 처리를 하는가? 이렇게 되면 이중 처리가 아닌가?  
-> 맨 처음 데이터베이스 연결할 때 커넥션에 문제가 있는지 파악하는 것과, 네트워크 통신 중 커넥션이 끊겼을 때에 대한 경고를 구분하기 위해서가 아닌가 생각하고 있다. 이 둘은 문제 해결을 위한 접근 방향이 다를 수 있기 때문이다.
4. mongoDB connect는 있는데 왜 disconnect를 설정하지 않는가?  
-> API 메소드에 대한 처리가 시작되면 connect하고 끝나면 disconnect하는게 마치 쓸 때만 켜고 끄는 것과 같아서 자원을 좀 더 효율적으로 쓰게 되지 않나? 라는 생각에서 비롯된 질문이었다. 이에 대해 좀 더 검토해본 결과 결론적으로 connect를 유지하는 것이 전반적으로 유리하다는 의견이 많았다. 왜냐하면 지속적으로 연결 및 해제를 반복하는 것은 이를 위한 프로세스가 늘 생성한다는 말이기 떄문에 오히려 네트워크 오버헤드를 초래할 수 있다는 의견이다. 물론 예상했던대로 수시로 켜고 끄는 형태는 서버 자원을 좀 더 효율적으로 활용하는 길이 될 수도 있다. 하지만 서비스 과정에서는 네트워크 통신 속도가 유저의 만족도와 직결되므로 컴퓨팅 자원을 늘릴지언정 속도를 잡는 것이 우선이겠다는 생각이 들었다. 추가적으로 장기간 통신이 없을 경우 `유휴 연결`을 유지하는 기능이 mongoDB에 탑재되어 있다고 한다. 일종의 잠자기 모드와 비슷한 개념이므로 해당 기능이 컴퓨팅 자원 이슈에 대한 부분을 커버해준다. 하지만 유휴 상태를 깨우는 시점에는 분명 딜레이가 발생할 것이다. 해당 소요 시간이 어떻냐도 고려해볼 문제인 것 같다.
### 유저의 get post 테스트
```javascript
// server.js
const express = require('express');
const app = express();
const PORT = 3000;

const usersRouter = require('./routes/users.router');

const connect = require('./schemas');
connect();

app.use(express.json());

app.use('/api/users', usersRouter);

app.listen(PORT, () => {
  console.log('Server is listening...', PORT);
});
```
해당 API 프로젝트의 메인은 server.js 파일이 맡는다. 간단히 API 처리를 위한 Flow를 살펴보면 먼저 미들웨어 활용을 통해 `/api/users`에 대한 처리를 usersRouter 변수로 넘겨지는 것을 확인할 수 있다. usersRouter는 `routes` 폴더 내 `users.router.js`파일에 해당하며 이 파일 내에서 express.Router() 메소드 활용을 통해 API method별 기능을 구분하여 구현 및 관리한다.

### mongoDB Schema
수집할 데이터에 대한 메타데이터 등록 즉 정의가 필요하다. 유저 정보를 수집한다면 구체적으로 어떤 타입으로 수집 유형에 대한 정의가 필요하고 이를 mongoDB에서는 스키마라고 부른다.
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});
module.exports = mongoose.model('User', userSchema);
```
위 스키마에서 정의하지 않은 ObjectId 즉 primary key의 경우 자동 생성된다. 하지만 createdAt과 updatedAt이 자동 생성되지 않는 다는 점이 mySQL과의 차이점이다.  

이 파트에서도 한 가지 의문점이 들었는데, 왜 스키마 별로 js 파일을 생성해서 따로 관리하려는 건지 의문이었다. 왜냐하면 models.js를 만들어서 해당 파일 안에 여러 스키마를 정의하여 이를 module.exports할 때 model이라는 객체를 생성해서 한데 담으면 프로젝트가 확장되는 과정에서 schema 파일을 계속 생성하게 될텐데 시각적으로도, 관리 차원에서도 파일이 많을 필요가 없을 것 같다는 생각이 들었기 떄문이다. ( 이부분은 문제가 없다면 향후 반영 예정 )  

### 라우터 영역
```javascript
const express = require('express');
const usersRouter = express.Router();

const User = require('../schemas/user');

usersRouter.get('/', async (req, res) => {
  const getUsers = await User.find({});

  res.json({ users: getUsers });
});

usersRouter.post('/', async (req, res) => {
  const { userId, password } = req.body;

  const createdUser = await User.create({ userId, password });

  res.send({ msg: '유저 등록 완료' });
});

module.exports = usersRouter;
```
schema 파일의 마지막 단에서 항상 `module.exports = mongoose.model('User', userSchema);`가 실행되므로 이를 require하면 스키마로 정의한 하나의 모델을 들고 오는 것과 같아진다. 재밌는 점은 (이는 MySQL과도 유사해 보이는데) 모델 생성 시 `User`라고 이름지어서 등록했는데 get, post 등을 요청할 경우 mongoDB에서는 해당 모델을 컬렉션으로 판단하고, 이름을 `users`라는 소문자와 복수형 단어로 변경해서 저장한다는 점이다.  

## 추가 진행 사항
### 로그인 기능 구현
Access Token 생성을 통해 향후 로그인 유저에 대해 포스팅 권한을 부여하는 방식을 구현할 예정
```javascript
// login.router.js
const express = require('express');
const issuebombomCookie = require('jsonwebtoken');
const User = require('../schemas/user');

const loginRouter = express.Router();

loginRouter.post('/', async (req, res) => {
  const user = req.body;

  // 데이터베이스에서 유저 정보 조회
  const findUser = await User.findOne({ userId: user.userId, password: user.password });
  if (findUser.length == 0) {
    return res.sendStatus(401);
  }

  // 토큰 생성
  const accessToken = issuebombomCookie.sign(user,
    process.env.ACCESS_TOKEN_KEY,
    { expiresIn: '20s' });
  const refreshToken = issuebombomCookie.sign(user,
    process.env.REFRESH_TOKEN_KEY,
    { expiresIn: '1h' });

  // refresh token 등록
  const update = { $set: { refreshToken } };
  await User.updateOne(findUser, update);

  // refresh token 쿠키로 전달
  res.cookie('issuebombomCookie', refreshToken, {
    httpOnly: true,
    maxAge: 1 * 60 * 60 * 1000 // 1 시간
  });

  res.setHeader('Authorization', `Bearer ${accessToken}`);
  res.sendStatus(200);
});

module.exports = loginRouter;
```
로그인을 시도하면 우선 데이터베이스에 해당 정보가 있는지, 즉 회원 여부를 판단한다.  
이후 회원임이 입증되면 유저 정보와 토큰 생성 키를 기반으로 Access Token 생성하여 유저에게 해더 내 Authorization으로 전달해준다.  
이를 통해 회원은 게시글 작성 및 조회 시 auth 기반으로 접근 범위를 결정할 수 있다.  

또한 Access Token이 권한 검증에 사용되는 기본적인 토큰이지만 유효 기간을 설정하고, 만료 시 refresh 토큰을 통해 재발급 받는 구조를 구현할 예정이다. 우선은 초기 로그인 시 refresh token도 함께 발급되며 이는 쿠키, 데이터베이스에 저장한다.  