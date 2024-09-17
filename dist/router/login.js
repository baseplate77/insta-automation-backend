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
loginRouter.post("/add-account", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accounts = req.body;
    try {
        if (accounts === undefined)
            throw "no details where provided";
        for (let { userId, password } of accounts) {
            let encrpytPassword = (0, encrypt_1.encrypt)(password);
            console.log(userId, password);
            let a = yield account_schema_1.accountModel.findOne({ userId: userId });
            console.log("account :", a);
            if (a !== null) {
                console.log(a.userId, "account already exist");
                continue;
            }
            let account = yield account_schema_1.accountModel.create({
                userId,
                password: encrpytPassword,
                isCookieValid: false,
                cookie: {},
            });
            yield account.save();
        }
        res.send({ success: true, addAccountNo: accounts.length });
    }
    catch (error) {
        console.log("unable to add account to db : ", error);
        res.status(500).send({ error: error, success: false });
    }
}));
loginRouter.get("/get-accounts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let accounts = yield account_schema_1.accountModel.find({}, { password: 1, userId: 1 });
        let ac = accounts.map((a) => {
            let decrpytPassword = (0, encrypt_1.decrypt)(a.password);
            return {
                userId: a.userId,
                password: decrpytPassword,
            };
        });
        res.send(ac);
    }
    catch (error) {
        console.log("error ", error);
        res.status(500).send({ success: false, error: error.toString() });
    }
}));
loginRouter.post("/update-password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, newPassword } = req.body;
    try {
        let account = yield account_schema_1.accountModel.findOne({ userId: userId }, { password: 1 });
        if (account === null)
            return "no entry with this userId was found";
        if (newPassword === "" || newPassword === undefined)
            throw "new password was empty";
        const encrpytPassword = (0, encrypt_1.encrypt)(newPassword);
        account.password = encrpytPassword;
        yield account.save();
        console.log("password updated");
        res.send({ success: true });
    }
    catch (error) {
        console.log("error in updating password :", userId, error);
        res.status(500).send({ success: false, error: error.toString() });
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
                    });
                    yield instaService.dispose();
                }));
                yield Promise.all([...promise]);
            }
        }
    }
    catch (error) {
        console.log("error :", error);
        res.status(500).send({ success: false, error: error.toString() });
    }
}));
exports.default = loginRouter;
