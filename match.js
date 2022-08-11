const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MatchSchema = new Schema({
  player1: { type: String, default: '' },
  player2: { type: String, default: '' },
  score1: { type: String, default: '' },
  score2: { type: String, default: '' },
  winner: { type: String, default: '' },
});

MatchSchema.method({});
MatchSchema.static({});

mongoose.model('Match', MatchSchema);