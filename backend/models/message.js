import {Schema, model} from "mongoose";

const MessageSchema = new Schema({
  from: {type: String, default: ''},
  to: {type: String, default: ''},
  message: {type: String, default: ''},
  timestamp: {type: String, default: ''},
  new: {type: Boolean, default: true},
});

MessageSchema.method({});
MessageSchema.static({});

model('Message', MessageSchema);