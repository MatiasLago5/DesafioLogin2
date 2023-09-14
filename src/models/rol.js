const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  password: String,
  role: { type: String, default: "usuario" }
});

module.exports = mongoose.model("User", userSchema);