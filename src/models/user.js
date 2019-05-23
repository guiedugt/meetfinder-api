const mongoose = require('mongoose');
require('mongoose-type-email');

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  email: mongoose.Schema.Types.Email,
});

module.exports = mongoose.model('User', schema);
