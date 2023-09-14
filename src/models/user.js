const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  githubId: String,
  age: { type: Number, default: 0 },
  email: { type: String, default: "" },
  last_name: { type: String, default: "" },
  first_name: { type: String, default: "" },
});

const User = mongoose.model("User", userSchema);

module.exports = User;




