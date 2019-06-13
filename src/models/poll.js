const mongoose = require('mongoose');
const User = require('./user');

const options = {
  versionKey: false,
};

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  deadline: {
    type: Date,
    required: true,
    validate: value => new Date(value) > Date.now(),
  },
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
  subjects: {
    type: [{
      name: { type: String, required: true },
      voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    }],
    required: true,
  },
}, options);

schema.virtual('status').get(function getStatus() {
  if (this.workshop) return 'scheduled';
  return Date.now() <= new Date(this.deadline)
    ? 'voting'
    : 'ended';
});


schema.method('toClient', function toClient() {
  const model = this.toObject({ virtuals: true });
  model.id = model._id;
  delete model._id;

  delete model.workshop;

  model.owner = User(model.owner).toClient();

  model.subjects = model.subjects.map(subject => ({
    ...subject,
    voters: subject.voters.map(voter => User(voter).toClient()),
  }));

  // eslint-disable-next-line no-param-reassign
  model.subjects.forEach(subject => delete subject._id);

  return model;
});


module.exports = mongoose.model('Poll', schema);
