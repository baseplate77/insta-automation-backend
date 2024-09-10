"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendMail = (to_1, subject_1, msg_1, ...args_1) => __awaiter(void 0, [to_1, subject_1, msg_1, ...args_1], void 0, function* (to, subject, msg, from = "Instaanalyzer <noreply@instaanalyser.com>") {
    try {
        const data = yield resend.emails.send({
            from: from,
            to: [to],
            subject: subject,
            html: msg,
        });
        console.log("mail send");
    }
    catch (error) {
        console.error(error);
    }
});
exports.sendMail = sendMail;
