"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatAccountModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const chatAccountSchema = new mongoose_1.default.Schema({
    dmLink: {
        type: String,
        require: true,
        unique: true,
    },
    accountId: {
        type: mongoose_1.default.Schema.ObjectId,
        ref: "account",
        require: true,
    },
    userId: String,
    scanData: mongoose_1.default.Schema.Types.Mixed,
    lastScanDate: Date,
});
chatAccountSchema.index({ dmLink: 1 }, { unique: true });
exports.chatAccountModel = mongoose_1.default.model("chatAccount", chatAccountSchema);
