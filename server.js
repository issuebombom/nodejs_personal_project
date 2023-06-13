const express = require('express');
const app = express();
const PORT = 3000;

const usersRouter = require('./routes/users.router');
// const postsRouter = require('./routes/posts.router');
// const commentRouter = require('./routes/comments.router');

const connect = require('./schemas');
connect();

app.use(express.json());

app.use('/api/users', usersRouter);
// app.use('/posts', postsRouter);
// app.use('/comment', commentRouter)

app.listen(PORT, () => {
  console.log('Server is listening...', PORT);
});