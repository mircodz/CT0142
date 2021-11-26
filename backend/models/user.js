const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: { type: String, default: '' },
  username: { type: String, default: '' },
  email: { type: String, default: '' },
  password: { type: String, default: '' },
  friends: { type: [mongoose.Types.ObjectId], default: [] }
});

UserSchema.method({});
UserSchema.static({});

mongoose.model('User', UserSchema);
