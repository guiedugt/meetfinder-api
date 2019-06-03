const auth = require('./auth');
const users = require('./users');
const polls = require('./polls');
const workshops = require('./workshops');

const jwt = require('../middleware/jwt');

const configureRoutes = (app) => {
  app.use('/auth', auth);
  app.use('/users', users);
  app.use('/polls', jwt, polls);
  app.use('/workshops', jwt, workshops);
};

module.exports = configureRoutes;
