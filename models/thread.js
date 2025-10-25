const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },  // ← Add validation
  delete_password: { type: String, required: true },  // ← Add validation
  created_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

const threadSchema = new mongoose.Schema({
  board: { type: String, required: true },  // ← Add validation
  text: { type: String, required: true },  // ← Add validation
  delete_password: { type: String, required: true },  // ← Add validation
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: [replySchema]
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;





// const mongoose = require('mongoose');

// const replySchema = new mongoose.Schema({
//   text: String,
//   delete_password: String,
//   created_on: { type: Date, default: Date.now },
//   reported: { type: Boolean, default: false }
// });

// const threadSchema = new mongoose.Schema({
//   board: String,
//   text: String,
//   delete_password: String,
//   created_on: { type: Date, default: Date.now },
//   bumped_on: { type: Date, default: Date.now },
//   reported: { type: Boolean, default: false },
//   replies: [replySchema]
// });

// const Thread = mongoose.model('Thread', threadSchema);

// module.exports = Thread;
