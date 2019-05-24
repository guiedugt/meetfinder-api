const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);

const mongodb = (_req, _res, next) => {
  const { MONGODB_USER, MONGODB_PASS } = process.env;

  const url = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@meetfinder-lwoni.mongodb.net/mongodb?retryWrites=true`;
  const config = {
    useNewUrlParser: true,
  };

  mongoose.connect(url, config);

  next();
};

module.exports = mongodb;
