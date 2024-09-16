"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const accountSchema = new mongoose_1.default.Schema({
    userId: { type: String, require: true },
    password: { type: String, require: true },
    cookie: mongoose_1.default.Schema.Types.Mixed,
    isCookieValid: Boolean,
});
exports.accountModel = mongoose_1.default.model("account", accountSchema);
