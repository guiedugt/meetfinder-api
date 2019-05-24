const mongoose = require('mongoose');

const options = { versionKey: false };

const schema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, required: true },
  poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll' },
}, options);

schema.toClient = function toClient() {
  this.id = this._id.toHexString();
  delete this._id;
};

module.exports = mongoose.model('Subject', schema);
