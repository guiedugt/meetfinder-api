const mongoose = require('mongoose');

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll' },
});

module.exports = mongoose.model('Subject', schema);
