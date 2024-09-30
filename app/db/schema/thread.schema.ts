import mongoose from "mongoose";

const threadSchema = new mongoose.Schema({
  userId: { type: String, require: true },
  messageId: { type: String, require: true },
  data: mongoose.Schema.Types.Mixed,
  userData: mongoose.Schema.Types.Mixed,
});

threadSchema.index({ userId: 1 }, { unique: true });

export const ThreadModel = mongoose.model("threads", threadSchema);
