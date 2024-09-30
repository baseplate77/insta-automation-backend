import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    type: { require: true, type: String },
    state: { require: true, type: mongoose.Schema.Types.Mixed },
    status: {
      require: true,
      enum: ["pending", "processing", "success", "failed"],
      type: String,
    },
    stopped_at: Date,
    stopped_count: { default: 0, type: Number },
  },
  { timestamps: true }
);

export const JobModel = mongoose.model("jobs", jobSchema);
