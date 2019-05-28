const auth = require('./auth');
const users = require('./users');
const polls = require('./polls');

const jwt = require('../middleware/jwt');

const configureRoutes = (app) => {
  app.use('/auth', auth);
  app.use('/users', users);
  app.use('/polls', jwt, polls);
};

module.exports = configureRoutes;
