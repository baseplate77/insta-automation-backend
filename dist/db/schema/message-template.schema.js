"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTemplateModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const messageTemplateSchema = new mongoose_1.default.Schema({
    name: { require: true, type: String },
    message: { require: true, type: String },
    type: { require: true, type: String },
    attachment: mongoose_1.default.Schema.Types.Mixed,
}, { timestamps: true });
exports.MessageTemplateModel = mongoose_1.default.model("messageTemplate", messageTemplateSchema);
