const auth = require('./auth');
const polls = require('./polls');
const users = require('./users');

const jwt = require('../middleware/jwt');

const configureRoutes = (app) => {
  app.use('/auth', auth);
  app.use('/polls', jwt, polls);
  app.use('/users', jwt, users);
};

module.exports = configureRoutes;
