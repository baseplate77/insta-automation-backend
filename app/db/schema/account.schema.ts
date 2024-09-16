import mongoose from "mongoose";

const accountSchema = new mongoose.Schema({
  userId: { type: String, require: true },
  password: { type: String, require: true },
  cookie: mongoose.Schema.Types.Mixed,
  isCookieValid: Boolean,
});

export const accountModel = mongoose.model("account", accountSchema);
