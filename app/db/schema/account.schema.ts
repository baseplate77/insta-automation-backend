import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  userId: { type: String, require: true },
  password: { type: String, require: true },
  node: { type: Number, require: true },
  gender: String,
  executiveName: String,
  phoneBackNumber: String,
  appNo: String,
  cookie: mongoose.Schema.Types.Mixed,
  isCookieValid: Boolean,
});

export const accountModel = mongoose.model("account", accountSchema);
