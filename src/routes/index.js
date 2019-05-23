const polls = require('./polls');
const users = require('./users');

const configureRoutes = (app) => {
  app.use('/polls', polls);
  app.use('/users', users);
};

module.exports = configureRoutes;
