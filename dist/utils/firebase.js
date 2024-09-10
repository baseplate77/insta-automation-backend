"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.amdin = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let serviceAccount = {
    type: "service_account",
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.RIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AITH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER,
    client_x509_cert_url: process.env.CLIENT_CERT_URL,
    universe_domain: "googleapis.com",
};
// Initialize Firebase Admin SDK
// const serviceAccount = require("./attendance-app-db-416e4-firebase-adminsdk-pf4g0-dedb567513.json");
exports.amdin = firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGE_BUCKET,
});
