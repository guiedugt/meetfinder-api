const mongoose = require('mongoose');
require('mongoose-type-email');

const options = { versionKey: false };

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  email: { type: mongoose.Schema.Types.Email, required: true, unique: true },
  password: { type: String, required: true },
}, options);

schema.method('toClient', function toClient() {
  const model = this.toObject();
  model.id = model._id;
  delete model._id;
  delete model.password;

  return model;
});

module.exports = mongoose.model('User', schema);
