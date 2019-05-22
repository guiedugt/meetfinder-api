const { model, Schema, Types } = require('mongoose');
require('mongoose-type-email');

const schema = Schema({
  _id: Types.ObjectId,
  name: String,
  email: Types.Email,
});

module.exports = model('User', schema);
