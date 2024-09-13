"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const accountSchema = new mongoose_1.default.Schema({
    usename: String,
    password: String,
    cookie: mongoose_1.default.Schema.Types.Mixed,
});
exports.accountModel = mongoose_1.default.model("account", accountSchema);
