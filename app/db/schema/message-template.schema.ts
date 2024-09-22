import mongoose from "mongoose";

const messageTemplateSchema = new mongoose.Schema(
  {
    name: { require: true, type: String },
    message: { require: true, type: String },
    type: { require: true, type: String },
    attachment: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const MessageTemplateModel = mongoose.model(
  "messageTemplate",
  messageTemplateSchema
);
