const mongoose = require('mongoose');

const connect = (req, res, next) => {
  const { MONGODB_USER, MONGODB_PASS } = process.env;

  const url = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@meetfinder-lwoni.mongodb.net/test?retryWrites=true`;
  const config = {
    useNewUrlParser: true,
  };

  mongoose.connect(url, config);

  next();
};

module.exports = { connect };
