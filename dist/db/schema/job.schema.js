"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jobSchema = new mongoose_1.default.Schema({
    type: { require: true, type: String },
    state: { require: true, type: mongoose_1.default.Schema.Types.Mixed },
    status: {
        require: true,
        enum: ["pending", "processing", "success", "failed"],
        type: String,
    },
    stopped_at: Date,
    stopped_count: { default: 0, type: Number },
}, { timestamps: true });
exports.JobModel = mongoose_1.default.model("jobs", jobSchema);
