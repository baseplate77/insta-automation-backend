"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const threadSchema = new mongoose_1.default.Schema({
    userId: { type: String, require: true },
    messageId: { type: String, require: true },
    data: mongoose_1.default.Schema.Types.Mixed,
    userData: mongoose_1.default.Schema.Types.Mixed,
});
threadSchema.index({ userId: 1 }, { unique: true });
exports.ThreadModel = mongoose_1.default.model("threads", threadSchema);
