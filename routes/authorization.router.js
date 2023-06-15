const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../schemas/user');

const authorizationController = require('../controllers/authorization.controller');

const authorizationRouter = express.Router();

authorizationRouter.post('/login', authorizationController.login);

authorizationRouter.get('/refresh', authorizationController.refresh);

module.exports = authorizationRouter;
