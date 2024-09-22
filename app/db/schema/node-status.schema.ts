import mongoose from "mongoose";

const nodeStatusSchema = new mongoose.Schema({
  status: {
    require: true,
    enum: ["running", "stopped"],
    type: String,
  },
  runCount: {
    type: Number,
    default: 0,
  },
  failCount: {
    type: Number,
    default: 0,
  },
  lastRunDate: Date,
  lastFailedData: Date,
});

export const NodeStatusModel = mongoose.model("nodeStatus", nodeStatusSchema);
