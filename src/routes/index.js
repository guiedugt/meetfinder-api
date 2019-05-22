const users = require('./users');

const configureRoutes = (app) => {
  app.use('/users', users);
};

module.exports = configureRoutes;
