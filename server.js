require('dotenv').config();
// const path = require('path');
const cookieParser = require('cookie-parser');
const express = require('express');

const HOST = '0.0.0.0';
const PORT = 3000;
const app = express();

// app.use('/routes', express.static(path.join(__dirname, 'routes')));
// app.use('/schemas', express.static(path.join(__dirname, 'schemas')));

const usersRouter = require('./routes/users.router');
const loginRouter = require('./routes/login.router');
const postsRouter = require('./routes/posts.router');
const refreshRouter = require('./routes/refresh.router');
const myPostRouter = require('./routes/mypost.router');
// const commentRouter = require('./routes/comments.router');

const connect = require('./schemas');
connect();

app.use(express.json());
app.use(cookieParser()); // npm i cookie-parser

app.use('/login', loginRouter);
app.use('/refresh', refreshRouter);
app.use('/api/users', usersRouter);
app.use('/posts', postsRouter);
app.use('/mypost', myPostRouter);
// app.use('/comment', commentRouter)

app.listen(PORT, HOST, () => {
  console.log('Server is listening...', PORT);
});