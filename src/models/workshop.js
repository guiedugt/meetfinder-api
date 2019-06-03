const mongoose = require('mongoose');

const User = require('./user');

const options = {
  versionKey: false,
};

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  date: { type: Date, required: true, validate: value => new Date(value) > Date.now() },
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  subject: { type: String, required: true },
  room: { type: String, required: true },
}, options);

schema.virtual('status').get(function getStatus() {
  return Date.now() <= new Date(this.date)
    ? 'scheduled'
    : 'ended';
});

schema.method('toClient', function toClient() {
  const model = this.toObject();
  model.id = model._id;
  delete model._id;

  model.owner = User(model.owner).toClient();
  delete model.poll;

  return model;
});


module.exports = mongoose.model('Workshop', schema);
