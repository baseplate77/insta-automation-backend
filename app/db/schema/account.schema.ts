import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  usename: String,
  password: String,
  cookie: mongoose.Schema.Types.Mixed,
});

export const accountModel = mongoose.model("account", accountSchema);
