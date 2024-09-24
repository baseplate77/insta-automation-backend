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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const insta_service_1 = __importDefault(require("../services/insta_service"));
const account_schema_1 = require("../db/schema/account.schema");
const encrypt_1 = require("../utils/encrypt");
const chatAccount_schema_1 = require("../db/schema/chatAccount.schema");
const console_1 = require("console");
const scanRouter = express_1.default.Router();
scanRouter.get("/scan-dm-db-test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("started");
    //   66e92a56b2edd4862ce157a2
    // const { accountId } = req.query;
    // let account = await accountModel.findById(accountId);
    // if (account === null) throw "no account with that id exists";
    try {
        let accounts = yield account_schema_1.accountModel.find({ isCookieValid: true });
        let batchSize = 2;
        for (let i = 0; i < accounts.length; i += batchSize) {
            const batch = accounts.slice(i, i + batchSize);
            let promise = batch.map((account) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    let decryptPassword = (0, encrypt_1.decrypt)(account.password);
                    let instaService = new insta_service_1.default();
                    yield instaService.init(account.userId, decryptPassword);
                    let page = yield instaService.dblogIn({
                        cookieLogin: true,
                        cookie: account.isCookieValid ? account.cookie : undefined,
                        setCookie: (cookie) => __awaiter(void 0, void 0, void 0, function* () {
                            account.cookie = cookie;
                            account.isCookieValid = true;
                            yield account.save();
                        }),
                        onFail: () => __awaiter(void 0, void 0, void 0, function* () {
                            account.isCookieValid = false;
                            account.cookie = undefined;
                            yield account.save();
                        }),
                    });
                    let data = yield instaService.scanDMs(page);
                    yield instaService.dispose();
                    console.log("account :", account._id);
                    let finalData = Object.keys(data).map((d) => ({
                        updateOne: {
                            filter: { dmLink: data[d]["link"] }, // Efficient query using indexed dmlink
                            update: {
                                $set: {
                                    dmLink: data[d]["link"],
                                    accountId: account._id,
                                },
                            }, // Update the document with new data
                            upsert: true, // Insert if the document doesn't exist
                            strict: false,
                        },
                    }));
                    let d = yield chatAccount_schema_1.chatAccountModel.bulkWrite(finalData);
                    console.log("done :", account.userId);
                }
                catch (error) {
                    console.log("error :", account.userId, error);
                }
            }));
            yield Promise.all([...promise]);
        }
        // console.log("log :", d);
    }
    catch (error) {
        console.log("error :", error);
    }
}));
scanRouter.get("/scan-dm-db", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("started");
    //   66e92a56b2edd4862ce157a2
    const { accountId } = req.query;
    try {
        let account = yield account_schema_1.accountModel.findById(accountId);
        if (account === null)
            throw "no account with that id exists";
        let decryptPassword = (0, encrypt_1.decrypt)(account.password);
        let instaService = new insta_service_1.default();
        yield instaService.init(account.userId, decryptPassword);
        let page = yield instaService.dblogIn({
            cookieLogin: true,
            cookie: account.isCookieValid ? account.cookie : undefined,
            setCookie: (cookie) => __awaiter(void 0, void 0, void 0, function* () {
                account.cookie = cookie;
                account.isCookieValid = true;
                yield account.save();
            }),
            onFail: () => __awaiter(void 0, void 0, void 0, function* () {
                account.isCookieValid = false;
                account.cookie = undefined;
                yield account.save();
            }),
        });
        let data = yield instaService.scanDMs(page);
        yield instaService.dispose();
        console.log("account :", account._id);
        let finalData = Object.keys(data).map((d) => ({
            updateOne: {
                filter: { dmLink: data[d]["link"] }, // Efficient query using indexed dmlink
                update: {
                    $set: {
                        dmLink: data[d]["link"],
                        accountId: account._id,
                    },
                }, // Update the document with new data
                upsert: true, // Insert if the document doesn't exist
                strict: false,
            },
        }));
        let d = yield chatAccount_schema_1.chatAccountModel.bulkWrite(finalData);
        // console.log("log :", d);
    }
    catch (error) {
        console.log("error :", error);
    }
}));
scanRouter.get("/get-all-links", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { accountId } = req.query;
    let links = yield chatAccount_schema_1.chatAccountModel.find({ accountId: accountId }, { dmLink: 1 });
    res.send(links);
}));
scanRouter.get("/full-scan-accounts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("started");
    try {
        let accounts = yield account_schema_1.accountModel.find({ isCookieValid: true }, { userId: 1, password: 1, cookie: 1, isCookieValid: 1 });
        let batchSize = 2;
        for (let i = 0; i < accounts.length; i += batchSize) {
            const batch = accounts.slice(i, i + batchSize);
            let promise = batch.map((account) => __awaiter(void 0, void 0, void 0, function* () {
                let links = yield chatAccount_schema_1.chatAccountModel.find({ accountId: account._id }, { dmLink: 1 });
                let instaService = new insta_service_1.default();
                let decryptPassword = (0, encrypt_1.decrypt)(account.password);
                yield instaService.init(account.userId, decryptPassword);
                let page = yield instaService.dblogIn({
                    cookieLogin: true,
                    cookie: account.cookie !== undefined ? account.cookie : "",
                    setCookie: (cookie) => __awaiter(void 0, void 0, void 0, function* () {
                        account.cookie = cookie;
                        account.isCookieValid = true;
                        yield account.save();
                    }),
                    onFail: () => __awaiter(void 0, void 0, void 0, function* () {
                        account.isCookieValid = false;
                        account.cookie = undefined;
                        yield account.save();
                    }),
                });
                let data = links.map((d) => d.dmLink);
                let finalData = yield instaService.dbSendDMAndFetchData({
                    links: data,
                    sendMessage: false,
                });
                console.log("scan complete for :", account.userId);
            }));
            yield Promise.all([...promise]);
        }
    }
    catch (erro) {
        console.log("error in full scan accounts :", console_1.error);
    }
}));
scanRouter.get("/scan-account", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { accountId } = req.query;
    res.send("ok");
    try {
        let links = yield chatAccount_schema_1.chatAccountModel.find({ accountId: accountId }, { dmLink: 1 });
        let account = yield account_schema_1.accountModel.findOne({ _id: accountId });
        if (account === null)
            throw "no account exist with this id";
        if (links === null || links.length === 0)
            throw "unable to get the links";
        let instaService = new insta_service_1.default();
        let decryptPassword = (0, encrypt_1.decrypt)(account.password);
        yield instaService.init(account.userId, decryptPassword);
        let page = yield instaService.dblogIn({
            cookieLogin: true,
            cookie: account.cookie !== undefined ? account.cookie : "",
            setCookie: (cookie) => __awaiter(void 0, void 0, void 0, function* () {
                account.cookie = cookie;
                account.isCookieValid = true;
                yield account.save();
            }),
            onFail: () => __awaiter(void 0, void 0, void 0, function* () {
                account.isCookieValid = false;
                account.cookie = undefined;
                yield account.save();
            }),
        });
        let data = links.map((d) => d.dmLink);
        let finalData = yield instaService.dbSendDMAndFetchData({
            links: data,
            sendMessage: false,
        });
        console.log("final data :", finalData);
        yield instaService.dispose();
    }
    catch (error) {
        console.log("error in full scan and send dm:", error);
    }
}));
exports.default = scanRouter;
// https://www.instagram.com/graphql/query
