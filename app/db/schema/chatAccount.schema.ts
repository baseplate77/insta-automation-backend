import mongoose, { mongo } from "mongoose";

const chatAccountSchema = new mongoose.Schema({
  dmLinks: {
    type: String,
    require: true,
  },
  accountId: {
    type: mongoose.Schema.ObjectId,
    ref: "account",
    require: true,
  },
});

export const chatAccountModel = mongoose.model(
  "chatAccount",
  chatAccountSchema
);
