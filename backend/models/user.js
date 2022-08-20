import {Schema, model} from "mongoose";

const UserSchema = new Schema({
  name: {type: String, default: ''},
  username: {type: String, default: ''},
  email: {type: String, default: ''},
  password: {type: String, default: ''},
  wins: {type: Number, default: 0},
  looses: {type: Number, default: 0},
  matches: {type: Number, default: 0},
  isModerator: {type: Boolean, default: false},
  isFirstLogin: {type: Boolean, default: false},
  friends: {type: [Schema.Types.ObjectID], default: []}
});

UserSchema.method({});
UserSchema.static({});

model('User', UserSchema);
