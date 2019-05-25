const mongoose = require('mongoose');
const User = require('./user');

const options = { versionKey: false };

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  deadline: { type: Date, required: true },
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['voting', 'ended'], required: true },
  subjects: {
    type: [{
      name: { type: String, required: true },
      voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    }],
    required: true,
  },
}, options);

schema.method('toClient', function toClient() {
  const model = this.toObject();
  model.id = model._id;
  delete model._id;

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
