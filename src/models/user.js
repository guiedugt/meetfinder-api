const mongoose = require('mongoose');
require('mongoose-type-email');

const options = { versionKey: false };

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  active: mongoose.Schema.Types.Boolean,
  name: { type: String, required: true },
  email: { type: mongoose.Schema.Types.Email, required: true, unique: true },
  password: { type: String, required: true },
  confirmEmailToken: String,
  confirmEmailExpiration: Number,
  resetPasswordToken: String,
  resetPasswordExpiration: Number,
}, options);

schema.method('toClient', function toClient() {
  const model = this.toObject();
  model.id = model._id;
  delete model._id;
  delete model.active;
  delete model.password;
  delete model.confirmEmailToken;
  delete model.confirmEmailExpiration;
  delete model.resetPasswordToken;
  delete model.resetPasswordExpiration;

  return model;
});

module.exports = mongoose.model('User', schema);
