"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeStatusModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const nodeStatusSchema = new mongoose_1.default.Schema({
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
exports.NodeStatusModel = mongoose_1.default.model("nodeStatus", nodeStatusSchema);
