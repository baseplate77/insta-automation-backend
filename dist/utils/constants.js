"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyList = exports.SEND_MSG_TYPE = exports.DM_SCAN_TYPE = exports.DETAILS_SCAN_TYPE = exports.SENDER_EMAIL = exports.prideEmail = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.prideEmail = "processautomationig@gmail.com";
exports.SENDER_EMAIL = "processcordinator28@gmail.com";
// export const SENDER_EMAIL = "base8087@gmail.com";
exports.DETAILS_SCAN_TYPE = "DETAILS_SCAN";
exports.DM_SCAN_TYPE = "DM_SCAN";
exports.SEND_MSG_TYPE = "SEND_MSG";
exports.proxyList = [
    `${process.env.PROXY_URL}:10001`,
    `${process.env.PROXY_URL}:10002`,
    `${process.env.PROXY_URL}:10003`,
    `${process.env.PROXY_URL}:10004`,
    `${process.env.PROXY_URL}:10005`,
    `${process.env.PROXY_URL}:10006`,
    `${process.env.PROXY_URL}:10007`,
    `${process.env.PROXY_URL}:10008`,
    `${process.env.PROXY_URL}:10009`,
    `${process.env.PROXY_URL}:10010`,
];
