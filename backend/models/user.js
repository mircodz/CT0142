const { Db } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, default: '' },
  username: { type: String, default: '' },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  wins: { type: Number, default: 0 },
  looses: { type: Number, default: 0 },
  matches: { type: Number, default: 0 },
  isModerator:{type: Boolean,default: false},
  isFirstLogin:{type: Boolean,default: false},
  friends: { type: [mongoose.Types.ObjectId], default: [] }
});

UserSchema.method({});
UserSchema.static({});

mongoose.model('User', UserSchema);
