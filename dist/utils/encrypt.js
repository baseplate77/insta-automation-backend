"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const algorithm = "aes-256-cbc";
const keyString = "this a random key";
const key = crypto_1.default
    .createHash("sha256")
    .update(keyString)
    .digest("base64")
    .slice(0, 32); // 256-bit key
const iv = crypto_1.default.randomBytes(16); // Initialization vector
function encrypt(text) {
    const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
}
function decrypt(encryptedText) {
    const [ivHex, encrypted] = encryptedText.split(":");
    const ivBuffer = Buffer.from(ivHex, "hex");
    const decipher = crypto_1.default.createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
