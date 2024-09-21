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
const account_schema_1 = require("../db/schema/account.schema");
const insta_service_1 = __importDefault(require("../services/insta_service"));
const encrypt_1 = require("../utils/encrypt");
const loginRouter = express_1.default.Router();
loginRouter.post("/login-by-userid", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userIds = req.body;
    try {
        if (userIds === undefined)
            throw "no userid is define";
        const batchSize = 2;
        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);
            const promises = batch.map((userId) => __awaiter(void 0, void 0, void 0, function* () {
                let account = yield account_schema_1.accountModel.findOne({ userId: userId });
                if (account !== null) {
                    let instaService = new insta_service_1.default();
                    let decryptPassword = (0, encrypt_1.decrypt)(account === null || account === void 0 ? void 0 : account.password);
                    console.log(account === null || account === void 0 ? void 0 : account.userId, decryptPassword);
                    //   return;
                    yield instaService.init(account === null || account === void 0 ? void 0 : account.userId, decryptPassword);
                    yield instaService.dblogIn({
                        cookieLogin: true,
                        cookie: undefined,
                        setCookie: (cookie) => __awaiter(void 0, void 0, void 0, function* () {
                            account.cookie = cookie;
                            account.isCookieValid = true;
                            yield (account === null || account === void 0 ? void 0 : account.save());
                        }),
                        onFail: () => __awaiter(void 0, void 0, void 0, function* () {
                            account.isCookieValid = false;
                            account.cookie = undefined;
                            yield account.save();
                        }),
                    });
                    yield instaService.dispose();
                }
                return account;
            }));
            const accounts = yield Promise.all(promises);
            console.log("accounts ", accounts);
            // Process accounts if needed
        }
        res.send("done");
    }
    catch (error) {
        console.log("error :", error);
        res.status(500).send({ error: error, success: false });
    }
}));
loginRouter.get("/login-all-accounts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let page = 1; // or any page number you want
        const limit = 2; // fetch 1000 users per page
        const totalDocs = yield account_schema_1.accountModel.countDocuments({
            isCookieValid: false,
        });
        const totalPages = Math.ceil(totalDocs / limit);
        console.log(totalDocs, totalPages);
        while (totalPages >= page) {
            let skip = (page - 1) * limit;
            let accounts = yield account_schema_1.accountModel
                .find({ isCookieValid: false }, { userId: 1, password: 1 })
                .skip(skip)
                .limit(limit)
                .exec();
            //   console.log(accounts, page);
            page++;
            if (accounts !== null) {
                let promise = accounts.map((account) => __awaiter(void 0, void 0, void 0, function* () {
                    let instaService = new insta_service_1.default();
                    let decryptPassword = (0, encrypt_1.decrypt)(account.password);
                    console.log(account.userId, decryptPassword);
                    //   return;
                    yield instaService.init(account.userId, decryptPassword);
                    yield instaService.dblogIn({
                        cookieLogin: true,
                        cookie: undefined,
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
                    yield instaService.dispose();
                }));
                yield Promise.all([...promise]);
            }
        }
        console.log("all login complete");
    }
    catch (error) {
        console.log("error :", error);
        res.status(500).send({ success: false, error: error.toString() });
    }
}));
exports.default = loginRouter;
