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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xlsx_1 = __importDefault(require("xlsx"));
const insta_service_1 = __importDefault(require("./services/insta_service"));
const constants_1 = require("./utils/constants");
const firebase_1 = require("./utils/firebase");
const resend_1 = require("./utils/resend");
const account_schema_1 = require("./db/schema/account.schema");
const encrypt_1 = require("./utils/encrypt");
const body_parser_1 = __importDefault(require("body-parser"));
const chatAccount_schema_1 = require("./db/schema/chatAccount.schema");
// dbService.connect();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(body_parser_1.default.json());
// const dbTest = async () => {
//   // const cookies = JSON.parse(
//   //   fs.readFileSync(path.join(__dirname, `cookies-${0}.json`), "utf-8")
//   // );
//   // console.log("cookie :", cookies);
//   accountModel.watch().on("change", (data) => console.log("data ;", data));
//   let account = await accountModel.create({
//     usename: "nj",
//   });
//   let a = await account.save();
//   console.log("a ;", a);
// };
// dbTest();
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let testKey = "hello you";
    let encrpyt = (0, encrypt_1.encrypt)(testKey);
    console.log("emcrypt:", encrpyt);
    let decrpt = (0, encrypt_1.decrypt)(encrpyt);
    console.log("decrpyt :", decrpt);
    res.send("ok");
}));
app.post("/add-account", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, password } = req.body;
    try {
        let encrpytPassword = (0, encrypt_1.encrypt)(password);
        let account = yield account_schema_1.accountModel.create({
            userId,
            password: encrpytPassword,
            isCookieValid: false,
            cookie: {},
        });
        yield account.save();
    }
    catch (error) {
        console.log("unable to add account to db : ", error);
    }
    res.send("ok");
}));
app.get("/scan-dm-account", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.query;
    try {
        let account = yield account_schema_1.accountModel.findOne({ userId: userId });
        if (account === null)
            throw "no account with userid exits " + userId;
        let encrpytPassword = account.password;
        let password = (0, encrypt_1.decrypt)(encrpytPassword !== null && encrpytPassword !== void 0 ? encrpytPassword : "");
        console.log("userId :", userId, password);
        let instaServer = new insta_service_1.default();
        yield instaServer.init(account.userId, password);
        let page = yield instaServer.dblogIn({
            cookieLogin: true,
            cookie: account.cookie,
            setCookie: (cookie) => __awaiter(void 0, void 0, void 0, function* () {
                account.cookie = cookie;
                account.isCookieValid = true;
                yield account.save();
            }),
        });
        let data = yield instaServer.scanDMs(page);
        let dmData = Object.keys(data).map((d) => (Object.assign(Object.assign({}, data[d]), { accountId: account._id })));
        yield chatAccount_schema_1.chatAccountModel.insertMany(dmData);
    }
    catch (error) {
        console.log("error :", error);
        res.status(500).send(error);
    }
    res.send("ok");
}));
app.get("/scan-dm", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { accNumber } = req.query;
    let index = parseInt(accNumber);
    res.send("started");
    // // get dm links
    // for (let index = 0; index < dmAccounts.length; index++) {
    var startTime = performance.now();
    const dmAccount = constants_1.fetchAccounts[index];
    console.log("account :", dmAccount);
    let instaServive = new insta_service_1.default();
    yield instaServive.init(dmAccount.username, dmAccount.password);
    let page = yield instaServive.logIn({ cookieLogin: true, index: index + 10 });
    // note after login need to handle the save info click to not now
    console.log("login completeddd");
    // await delay(10000000);
    let finaldata = yield instaServive.scanDMs(page);
    let details = Object.keys(finaldata).map((dmData) => finaldata[dmData]);
    let links = Object.keys(finaldata).map((dmData) => finaldata[dmData]["link"]);
    console.log("links :", links);
    let data = yield instaServive.sendDMAndFetchData(links.reverse());
    console.log("data :", data);
    yield instaServive.dispose();
    const wb = xlsx_1.default.utils.book_new();
    const ws = xlsx_1.default.utils.json_to_sheet(details);
    // Append the worksheet to the workbook
    xlsx_1.default.utils.book_append_sheet(wb, ws, "UserIDs");
    // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    // Write the workbook to a file
    let filePath = path_1.default.join(__dirname, `${dmAccount.username}.xlsx`);
    xlsx_1.default.writeFile(wb, filePath);
    // console.log("links :", links.length);
    xlsx_1.default.writeFile(wb, filePath);
    const bucket = firebase_1.amdin.storage().bucket();
    yield bucket.upload(filePath, {
        destination: `insta-data/${dmAccount.username}.xlsx`,
        metadata: {
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
    const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
    const [url] = yield file.getSignedUrl({
        action: "read",
        expires: "03-01-2500", // Set an appropriate expiration date
    });
    var endTime = performance.now();
    yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-report-${dmAccount.username}`, `
      <div>
        DM scan for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}.xlsx</a>
      </div>
      `);
    // }
}));
app.get("/send-msg", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { accNumber } = req.query;
    let index = parseInt((_a = accNumber) !== null && _a !== void 0 ? _a : "0");
    let links = [
        "https://www.instagram.com/direct/t/17844923517215556/",
        "https://www.instagram.com/direct/t/113317673393519/",
        // "https://www.instagram.com/direct/t/103980751005186/",
        // "https://www.instagram.com/direct/t/111939926858978/",
        // "https://www.instagram.com/direct/t/113536340193789/",
        // "https://www.instagram.com/direct/t/111822650205394/",
        // "https://www.instagram.com/direct/t/122784635777726/",
        // "https://www.instagram.com/direct/t/117914032930523/",
        // "https://www.instagram.com/direct/t/112948393434025/",
        // "https://www.instagram.com/direct/t/115295616534246/",
        // "https://www.instagram.com/direct/t/17845396595519528/",
    ];
    try {
        let dmAccount = constants_1.fetchAccounts[index];
        let instaServive = new insta_service_1.default();
        yield instaServive.init(dmAccount.username, dmAccount.password);
        let page = yield instaServive.logIn({
            cookieLogin: true,
            index: index + 10,
        });
        let startTime = performance.now();
        let data = yield instaServive.sendDMAndFetchData(links);
        const wb = xlsx_1.default.utils.book_new();
        const ws = xlsx_1.default.utils.json_to_sheet(data);
        // Append the worksheet to the workbook
        xlsx_1.default.utils.book_append_sheet(wb, ws, "UserIDs");
        // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        // Write the workbook to a file
        let filePath = path_1.default.join(__dirname, `${dmAccount.username}-dm-detail.xlsx`);
        xlsx_1.default.writeFile(wb, filePath);
        const bucket = firebase_1.amdin.storage().bucket();
        yield bucket.upload(filePath, {
            destination: `insta-data/${dmAccount.username}.xlsx`,
            metadata: {
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
        const file = bucket.file(`insta-data/${dmAccount.username}-dm-detail.xlsx`);
        const [url] = yield file.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
        });
        var endTime = performance.now();
        yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-DM-report-${dmAccount.username}`, `
      <div>
        DM Detail data for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}-dm-details.xlsx</a>
      </div>
      `);
        console.log("completed");
    }
    catch (error) {
        console.log("error in send the message");
    }
}));
app.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // test on 10 acounts
    const { accNumber } = req.query;
    let index = parseInt(accNumber);
    res.send("started");
    // get dm links
    // for (let index = 0; index < 1; index++) {
    var startTime = performance.now();
    const dmAccount = constants_1.dmAccounts[index];
    console.log("account :", dmAccount);
    let instaServive = new insta_service_1.default();
    yield instaServive.init(dmAccount.username, dmAccount.password);
    let page = yield instaServive.logIn({ cookieLogin: true, index });
    // note after login need to handle the save info click to not now
    console.log("login completeddd");
    let finaldata = yield instaServive.scanDMs(page);
    let links = Object.keys(finaldata).map((dmData) => (Object.assign({ link: "https://www.instagram.com" + dmData }, finaldata[dmData])));
    yield instaServive.dispose();
    console.log("finalData :", links);
    // console.log("links :", links.length);
    fs_1.default.writeFileSync(path_1.default.join(__dirname, `finalData-${index}.json`), JSON.stringify(links));
    // console.log("final data :", finaldata);
    // scan the ids
    let linksPerAccount = 2;
    let noOfAccount = 20;
    let userIds = [];
    for (let i = 0; i < links.length; i += linksPerAccount) {
        let accountLinks = links.splice(i, linksPerAccount);
        console.log("account Link :", accountLinks);
        instaServive = new insta_service_1.default();
        let accountNo = (i / linksPerAccount) % noOfAccount;
        let fetchAccount = constants_1.fetchAccounts[accountNo];
        console.log("fetch account :", fetchAccount, accountNo);
        yield instaServive.init(fetchAccount.username, fetchAccount.password);
        yield instaServive.logIn({ cookieLogin: true, index: index });
        let tempId = yield instaServive.fetchUserIdFromDmLinks(accountLinks);
        userIds.push(...tempId);
        yield instaServive.dispose();
    }
    const wb = xlsx_1.default.utils.book_new();
    const ws = xlsx_1.default.utils.json_to_sheet(userIds);
    // Append the worksheet to the workbook
    xlsx_1.default.utils.book_append_sheet(wb, ws, "UserIDs");
    // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    // Write the workbook to a file
    let filePath = path_1.default.join(__dirname, `${dmAccount.username}.xlsx`);
    xlsx_1.default.writeFile(wb, filePath);
    const bucket = firebase_1.amdin.storage().bucket();
    yield bucket.upload(filePath, {
        destination: `insta-data/${dmAccount.username}.xlsx`,
        metadata: {
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
    const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
    const [url] = yield file.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
    });
    var endTime = performance.now();
    yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-report-${dmAccount.username}`, `
      <div>
        Fetch data for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}.xlsx</a>
      </div>
      `);
    console.log("completed");
    // fs.writeFileSync(
    //   path.join(__dirname, `userids-${index}.json`),
    //   JSON.stringify(userids)
    // );
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`);
    // }
}));
app.get("/test2", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // test on 10 acounts
    res.send("started");
    // get dm links
    for (let index = 5; index < constants_1.dmAccounts.length; index++) {
        var startTime = performance.now();
        const dmAccount = constants_1.dmAccounts[index];
        console.log("account :", dmAccount);
        let instaServive = new insta_service_1.default();
        yield instaServive.init(dmAccount.username, dmAccount.password);
        let page = yield instaServive.logIn({ cookieLogin: true, index });
        // note after login need to handle the save info click to not now
        console.log("login completeddd");
        let finaldata = yield instaServive.scanDMs(page);
        let links = Object.keys(finaldata).map((dmData) => "https://www.instagram.com" + dmData);
        yield instaServive.dispose();
        // console.log("links :", links.length);
        fs_1.default.writeFileSync(path_1.default.join(__dirname, `finalData-${index}.json`), JSON.stringify(links));
        // console.log("final data :", finaldata);
        // scan the ids
        instaServive = new insta_service_1.default();
        let fetchAccount = constants_1.fetchAccounts[index];
        yield instaServive.init(fetchAccount.username, fetchAccount.password);
        yield instaServive.logIn({ cookieLogin: true, index: index + 100 });
        let userids = yield instaServive.fetchUserIdFromDmLinks(links.slice(0, 100));
        yield instaServive.dispose();
        const wb = xlsx_1.default.utils.book_new();
        const ws = xlsx_1.default.utils.json_to_sheet(userids);
        // Append the worksheet to the workbook
        xlsx_1.default.utils.book_append_sheet(wb, ws, "UserIDs");
        // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        // Write the workbook to a file
        let filePath = path_1.default.join(__dirname, `${dmAccount.username}.xlsx`);
        xlsx_1.default.writeFile(wb, filePath);
        const bucket = firebase_1.amdin.storage().bucket();
        yield bucket.upload(filePath, {
            destination: `insta-data/${dmAccount.username}.xlsx`,
            metadata: {
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
        const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
        const [url] = yield file.getSignedUrl({
            action: "read",
            expires: "03-01-2500", // Set an appropriate expiration date
        });
        var endTime = performance.now();
        yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-report-${dmAccount.username}`, `
      <div>
        Fetch data for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}.xlsx</a>
      </div>
      `);
        console.log("completed");
        // fs.writeFileSync(
        //   path.join(__dirname, `userids-${index}.json`),
        //   JSON.stringify(userids)
        // );
        console.log(`Call to doSomething took ${endTime - startTime} milliseconds`);
    }
}));
app.get("/insta-login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let finaldata = {};
    try {
        //   // await page.goto("https://www.instagram.com/", {
        //   //   waitUntil: ["load", "networkidle0"],
        //   // });
        //   console.log("page loaded ");
        let instaServive = new insta_service_1.default();
        let fetchAccount = constants_1.fetchAccounts[0];
        yield instaServive.init(fetchAccount.username, fetchAccount.password);
        //   try {
        let page = yield instaServive.logIn({ cookieLogin: true });
        //     finaldata = await instaServive.scanDMs(page);
        let links = Object.keys(constants_1.dmFetchData).map((dmData) => "https://www.instagram.com" + dmData);
        let userIds = yield instaServive.fetchUserIdFromDmLinks(links);
        //   } catch (error) {
        //     console.log("error :", error);
        //   }
        // -------
        // setp 2
        // open the chat link and save the user Id
        console.log("hi there ");
        res.send({ userIds });
    }
    catch (error) {
        console.log("fail to finish :", error);
        // add retry logic
    }
    console.log("at the end");
}));
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
