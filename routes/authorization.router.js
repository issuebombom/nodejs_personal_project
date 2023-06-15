const express = require('express');
const cookieParser = require('cookie-parser');

const User = require('../schemas/user');
const authMiddleware = require('../verification'); // 토큰 검증을 위한 미들웨어

const authorizationController = require('../controllers/authorization.controller');

const authorizationRouter = express.Router();
authorizationRouter.use(cookieParser());

authorizationRouter.post('/login', authorizationController.login);

authorizationRouter.get('/refresh', authMiddleware, authorizationController.refresh);

module.exports = authorizationRouter;
