import mongoose from "mongoose";

const chatAccountSchema = new mongoose.Schema({
  dmLink: {
    type: String,
    require: true,
    unique: true,
  },
  accountId: {
    type: mongoose.Schema.ObjectId,
    ref: "account",
    require: true,
  },
  userId: String,
  scanData: mongoose.Schema.Types.Mixed,
  lastScanDate: Date,
});
chatAccountSchema.index({ dmLink: 1 }, { unique: true });

export const chatAccountModel = mongoose.model(
  "chatAccount",
  chatAccountSchema
);
