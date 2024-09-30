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
const firebase_1 = require("./utils/firebase");
const resend_1 = require("./utils/resend");
const account_schema_1 = require("./db/schema/account.schema");
const delay_1 = __importDefault(require("./utils/delay"));
const encrypt_1 = require("./utils/encrypt");
const db_service_1 = __importDefault(require("./db/db_service"));
const body_parser_1 = __importDefault(require("body-parser"));
const chatAccount_schema_1 = require("./db/schema/chatAccount.schema");
const login_1 = __importDefault(require("./router/login"));
const scan_1 = __importDefault(require("./router/scan"));
const accounts_1 = require("./utils/accounts");
const accounts_2 = __importDefault(require("./router/accounts"));
const cors_1 = __importDefault(require("cors"));
const message_template_1 = __importDefault(require("./router/message-template"));
const instagram_private_api_1 = require("instagram-private-api");
const inquirer_1 = __importDefault(require("inquirer"));
const browerSetup_1 = require("./utils/browerSetup");
const thread_schema_1 = require("./db/schema/thread.schema");
const job_service_1 = __importDefault(require("./services/job_service"));
const jobs_1 = __importDefault(require("./router/jobs"));
db_service_1.default.connect();
const app = (0, express_1.default)();
const port = process.argv[2] || process.env.PORT || 3000;
console.log("arg :", process.env.PORT, process.argv);
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
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
app.use(accounts_2.default);
app.use(message_template_1.default);
app.use(login_1.default);
app.use(scan_1.default);
app.use(jobs_1.default);
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("working on express server");
}));
app.post("/add-test-job", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { type, state } = req.body;
    let jobServoce = new job_service_1.default();
    let job = yield jobServoce.addJob({ type, state });
    res.send(Object.assign({}, job));
}));
app.get("/get-all-userid", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userId = yield account_schema_1.accountModel.find({}, { userId: 1 });
    let userMap = userId.map((i) => i["userId"]);
    res.send(userMap);
}));
app.get("/open-browser-proxy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let browser = yield browerSetup_1.globalBrowser.initBrower();
    console.log("browser opened");
    let page = yield (browser === null || browser === void 0 ? void 0 : browser.newPage());
    // await page?.goto("https://whatismyipaddress.com/", { timeout: 0 });
    // let context = await page?.content();
}));
app.get("/get-user-profile-data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ig = new instagram_private_api_1.IgApiClient();
        const session = JSON.parse(fs_1.default.readFileSync("./session.json", "utf-8"));
        yield ig.state.deserialize(session);
        let page = 1;
        let limit = 20;
        let loop = true;
        let data = [];
        while (loop) {
            let skip = (page - 1) * limit;
            let users = yield thread_schema_1.ThreadModel.find({ userData: { $exists: false } })
                .skip(skip)
                .limit(limit);
            for (let index = 0; index < users.length; index++) {
                const user = users[index];
                try {
                    // get complete user info
                    let userProfile = yield ig.user.info(user.data.pk);
                    console.log("user fetch,", userProfile.username);
                    yield thread_schema_1.ThreadModel.updateOne({ userId: user.userId }, // Query to find the document by user_id
                    { $set: { userData: userProfile } } // Update the userData field with new value
                    );
                    console.log("user profile saved");
                    // console.log("userProfile :", JSON.stringify(userProfile));
                }
                catch (error) {
                    if (error instanceof instagram_private_api_1.IgResponseError &&
                        error.message.includes("feedback_required")) {
                        loop = false;
                        throw error;
                    }
                    console.log("error :", error);
                }
                const randomDelay = Math.floor(Math.random() * 3) + 2;
                yield (0, delay_1.default)(randomDelay * 1000);
                data.push(user.userId);
            }
            console.log("page ", page);
            if (users.length === 0) {
                loop = false;
            }
            else {
                page++;
            }
        }
        res.send(data);
    }
    catch (error) {
        console.log("error in getting user details", error);
        res.send({ error });
    }
}));
function handleChallenge(ig, error) {
    return __awaiter(this, void 0, void 0, function* () {
        const { api } = error;
        yield ig.challenge.auto(true); // Requesting the challenge (true means automatic selection)
        const challengeChoices = yield inquirer_1.default.prompt([
            {
                type: "list",
                name: "method",
                message: "Select a challenge method:",
                choices: [
                    { name: "Email", value: "1" },
                    { name: "Phone", value: "0" },
                ],
            },
        ]);
        // Submitting the selected challenge option (email or phone)
        yield ig.challenge.selectVerifyMethod(challengeChoices.method);
        const codePrompt = yield inquirer_1.default.prompt([
            {
                type: "input",
                name: "code",
                message: "Enter the verification code you received:",
            },
        ]);
        // Submitting the verification code
        yield ig.challenge.sendSecurityCode(codePrompt.code);
        console.log("Challenge handled successfully!");
    });
}
function handleTwoFactorAuth(ig, error) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username } = error;
        const twoFactorPrompt = yield inquirer_1.default.prompt([
            {
                type: "input",
                name: "code",
                message: "Enter the two-factor authentication code:",
            },
        ]);
        yield ig.account.twoFactorLogin({
            username,
            verificationCode: twoFactorPrompt.code,
            twoFactorIdentifier: error.response.body.two_factor_info.two_factor_identifier,
            verificationMethod: "1", // Assuming 1 is SMS
            trustThisDevice: "1",
        });
        console.log("Logged in with two-factor authentication successfully!");
    });
}
app.get("/private-login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const ig = new instagram_private_api_1.IgApiClient();
    try {
        ig.state.generateDevice("mccray_shih017");
        yield ig.simulate.preLoginFlow();
        console.log("pre login");
        const loggedInUser = yield ig.account.login("mccray_shih017", "alfaalfa234");
        console.log("login complete ;", loggedInUser.pk);
        process.nextTick(() => __awaiter(void 0, void 0, void 0, function* () { return yield ig.simulate.postLoginFlow(); }));
        console.log("post login flow");
        const session = yield ig.state.serialize(); // This returns an object with cookies and other session-related info
        delete session.constants; // Remove unnecessary data
        fs_1.default.writeFileSync("./session.json", JSON.stringify(session));
        res.send("login complete");
    }
    catch (error) {
        if (error instanceof instagram_private_api_1.IgCheckpointError) {
            console.log("Challenge required. Handling challenge...");
            yield handleChallenge(ig, error);
            res.send("challenge");
        }
        else if (error instanceof instagram_private_api_1.IgLoginTwoFactorRequiredError) {
            console.log("Two-factor authentication required.");
            yield handleTwoFactorAuth(ig, error);
            res.send("2fa");
        }
        else {
            console.log("Error during login:", error.message);
            res.send("error");
        }
    }
}));
app.get("/private-thread-data", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let dmList = [];
    try {
        const ig = new instagram_private_api_1.IgApiClient();
        const session = JSON.parse(fs_1.default.readFileSync("./session.json", "utf-8"));
        yield ig.state.deserialize(session);
        // inbox.forEach((thread) => {
        //   console.log(`Thread ID: ${thread.thread_id}`);
        //   thread.users.forEach((user) => {
        //     console.log(
        //       `User: ${user.username}, Full Name: ${user.full_name} ${thread.last_activity_at} ${thread.last_seen_at}`
        //     );
        //   });
        // });
        // console.log("more :", inboxFeed.isMoreAvailable());
        let inboxFeed;
        let inbox;
        let thereIsMore = false;
        let hasRun = false;
        if (!hasRun) {
            inboxFeed = ig.feed.directInbox();
            hasRun = true;
        }
        // if (lastCursor) {
        //   inboxFeed.state. = lastCursor;
        // }
        do {
            inbox = yield inboxFeed.items();
            try {
                for (let index = 0; index < inbox.length; index++) {
                    const thread = inbox[index];
                    for (let index = 0; index < thread.users.length; index++) {
                        const user = thread.users[index];
                        // try {
                        //   // get complete user info
                        //   let userProfile = await ig.user.info(user.pk);
                        //   console.log("user fetch,", userProfile.full_name);
                        //   // console.log("userProfile :", JSON.stringify(userProfile));
                        // } catch (error) {
                        //   console.log("error :", error);
                        // }
                        dmList.push(user);
                        if (dmList.length % 100 === 0) {
                            yield (0, delay_1.default)(5000);
                        }
                        else {
                            const randomDelay = Math.floor(Math.random() * 1) + 0;
                            yield (0, delay_1.default)(randomDelay * 1000);
                        }
                        // let threadModel = await ThreadModel.create({
                        //   userId: user.username,
                        //   messageId: user["interop_messaging_user_fbid"],
                        //   data: user,
                        // });
                        // await threadModel.save();
                        // await ThreadModel.updateOne(
                        //   { userId: user.username },
                        //   {
                        //     $set: {
                        //       userId: user.username,
                        //       messageId: user["interop_messaging_user_fbid"],
                        //       data: user,
                        //     },
                        //   },
                        //   {
                        //     upsert: true,
                        //   }
                        // );
                        // console.log("save to db");
                        console.log(`User: ${user.username}, Full Name: ${user.full_name} ${user.pk} `, user.last_activity_at, user.last_seen_at
                        // `${thread.thread_id}`
                        );
                    }
                }
                // inbox.forEach(async (thread) => {
                //   thread.users.forEach(async (user) => {
                //     try {
                //       // get complete user info
                //       let userProfile = await ig.user.info(user.pk);
                //       console.log("user fetch,", user.username);
                //       await delay(3000);
                //       // console.log("userProfile :", JSON.stringify(userProfile));
                //     } catch (error) {
                //       console.log("error :", error);
                //     }
                //     dmList.push(user);
                //     console.log(
                //       `User: ${user.username}, Full Name: ${user.full_name} `,
                //       JSON.stringify(thread.last_activity_at),
                //       JSON.stringify(thread.last_seen_at)
                //       // `${thread.thread_id}`
                //     );
                //   });
                // });
                thereIsMore = inboxFeed.isMoreAvailable();
                console.log("ismore :", thereIsMore);
            }
            catch (error) {
                console.log("error :", error);
                thereIsMore = false;
            }
            console.log("count :", dmList.length);
            yield (0, delay_1.default)(1000);
        } while (thereIsMore);
        res.send({ ok: "l", dmList });
    }
    catch (error) {
        console.log("found error :", error);
        res.send({ error: true, dmList });
    }
}));
app.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const accounts = yield account_schema_1.accountModel.find({}, { userId: 1 });
    let total = 0;
    let data = [];
    for (let index = 0; index < accounts.length; index++) {
        const account = accounts[index];
        let count = yield chatAccount_schema_1.chatAccountModel.countDocuments({
            accountId: account._id,
        });
        total += count;
        data.push({ count, userID: account.userId });
    }
    res.send({ total, data });
}));
app.get("/test-login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("started");
    let promise = accounts_1.testAccounts.map((account, index) => __awaiter(void 0, void 0, void 0, function* () {
        // const account = testAccounts[index];
        console.log("account :", account, index + 1);
        try {
            let instaService = new insta_service_1.default();
            yield instaService.init(account.userId, account.password);
            yield (0, delay_1.default)(1000 * index);
            yield instaService.logIn({ cookieLogin: true, index: index + 10 });
            yield instaService.dispose();
        }
        catch (error) {
            console.log("failed to login :", account);
        }
    }));
    yield Promise.all([...promise]);
    console.log("complete");
}));
app.get("/test-scan-dm", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("started");
    try {
        let promise = accounts_1.testAccounts.map((dmAccount, index) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                var startTime = performance.now();
                console.log("account :", dmAccount);
                let instaServive = new insta_service_1.default();
                yield instaServive.init(dmAccount.userId, dmAccount.password);
                let page = yield instaServive.logIn({
                    cookieLogin: true,
                    index: index + 10,
                });
                // note after login need to handle the save info click to not now
                console.log("login completeddd");
                // await delay(10000000);
                let finaldata = yield instaServive.scanDMs(page);
                let details = Object.keys(finaldata).map((dmData) => finaldata[dmData]);
                let links = Object.keys(finaldata).map((dmData) => finaldata[dmData]["link"]);
                console.log("links :", links);
                // let data = await instaServive.sendDMAndFetchData(links.reverse());
                // console.log("data :", data);
                yield instaServive.dispose();
                const wb = xlsx_1.default.utils.book_new();
                const ws = xlsx_1.default.utils.json_to_sheet(details);
                // Append the worksheet to the workbook
                xlsx_1.default.utils.book_append_sheet(wb, ws, "UserIDs");
                // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
                // Write the workbook to a file
                let filePath = path_1.default.join(__dirname, `${dmAccount.userId}.xlsx`);
                xlsx_1.default.writeFile(wb, filePath);
                // console.log("links :", links.length);
                xlsx_1.default.writeFile(wb, filePath);
                const bucket = firebase_1.amdin.storage().bucket();
                yield bucket.upload(filePath, {
                    destination: `insta-data/${dmAccount.userId}.xlsx`,
                    metadata: {
                        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    },
                });
                const file = bucket.file(`insta-data/${dmAccount.userId}.xlsx`);
                const [url] = yield file.getSignedUrl({
                    action: "read",
                    expires: "03-01-2500", // Set an appropriate expiration date
                });
                var endTime = performance.now();
                yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-report-${dmAccount.userId}`, `
            <div>
              DM scan for account ${dmAccount.userId}
      
              time for execution - ${endTime - startTime} milliseconds
              <a href="${url}">${dmAccount.userId}.xlsx</a>
            </div>
            `);
            }
            catch (error) {
                console.log("erorr  in test scana and send dm :", error);
            }
        }));
        yield Promise.all([...promise]);
        console.log("completed");
    }
    catch (error) {
        console.log("error", error);
    }
}));
// app.get("/login-all-account",async (req:Request,res:Response) => {
// })
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
    const dmAccount = accounts_1.dmAccounts[index];
    console.log("account :", dmAccount);
    let instaServive = new insta_service_1.default();
    yield instaServive.init(dmAccount.userId, dmAccount.password);
    let page = yield instaServive.logIn({ cookieLogin: true, index: index });
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
    let filePath = path_1.default.join(__dirname, `${dmAccount.userId}.xlsx`);
    xlsx_1.default.writeFile(wb, filePath);
    // console.log("links :", links.length);
    xlsx_1.default.writeFile(wb, filePath);
    const bucket = firebase_1.amdin.storage().bucket();
    yield bucket.upload(filePath, {
        destination: `insta-data/${dmAccount.userId}.xlsx`,
        metadata: {
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
    const file = bucket.file(`insta-data/${dmAccount.userId}.xlsx`);
    const [url] = yield file.getSignedUrl({
        action: "read",
        expires: "03-01-2500", // Set an appropriate expiration date
    });
    var endTime = performance.now();
    yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-report-${dmAccount.userId}`, `
      <div>
        DM scan for account ${dmAccount.userId}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.userId}.xlsx</a>
      </div>
      `);
    // }
}));
app.get("/send-msg", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let { accNumber } = req.query;
    let index = parseInt((_a = accNumber) !== null && _a !== void 0 ? _a : "0");
    let links = [
        "https://www.instagram.com/direct/t/111382850255581/",
        "https://www.instagram.com/direct/t/108552750540243/",
        "https://www.instagram.com/direct/t/112404146825528/",
        "https://www.instagram.com/direct/t/106598704071063/",
        "https://www.instagram.com/direct/t/113317673393519/",
        "https://www.instagram.com/direct/t/17844923517215556/",
        "https://www.instagram.com/direct/t/106758504055478/",
        "https://www.instagram.com/direct/t/115651616491680/",
        "https://www.instagram.com/direct/t/106188530779387/",
        "https://www.instagram.com/direct/t/104243080974451/",
        "https://www.instagram.com/direct/t/104112324321190/",
        "https://www.instagram.com/direct/t/118002332921612/",
        "https://www.instagram.com/direct/t/17846607429176689/",
        "https://www.instagram.com/direct/t/114496199940296/",
    ];
    try {
        let dmAccount = accounts_1.fetchAccounts[index];
        console.log("account :", dmAccount);
        let instaServive = new insta_service_1.default();
        yield instaServive.init(dmAccount.userId, dmAccount.password);
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
        let filePath = path_1.default.join(__dirname, `${dmAccount.userId}-dm-detail.xlsx`);
        xlsx_1.default.writeFile(wb, filePath);
        const bucket = firebase_1.amdin.storage().bucket();
        yield bucket.upload(filePath, {
            destination: `insta-data/${dmAccount.userId}.xlsx`,
            metadata: {
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
        const file = bucket.file(`insta-data/${dmAccount.userId}-dm-detail.xlsx`);
        const [url] = yield file.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
        });
        var endTime = performance.now();
        yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-DM-report-${dmAccount.userId}`, `
      <div>
        DM Detail data for account ${dmAccount.userId}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.userId}-dm-details.xlsx</a>
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
    const dmAccount = accounts_1.dmAccounts[index];
    console.log("account :", dmAccount);
    let instaServive = new insta_service_1.default();
    yield instaServive.init(dmAccount.userId, dmAccount.password);
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
        let fetchAccount = accounts_1.fetchAccounts[accountNo];
        console.log("fetch account :", fetchAccount, accountNo);
        yield instaServive.init(fetchAccount.userId, fetchAccount.password);
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
    let filePath = path_1.default.join(__dirname, `${dmAccount.userId}.xlsx`);
    xlsx_1.default.writeFile(wb, filePath);
    const bucket = firebase_1.amdin.storage().bucket();
    yield bucket.upload(filePath, {
        destination: `insta-data/${dmAccount.userId}.xlsx`,
        metadata: {
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
    });
    const file = bucket.file(`insta-data/${dmAccount.userId}.xlsx`);
    const [url] = yield file.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
    });
    var endTime = performance.now();
    yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-report-${dmAccount.userId}`, `
      <div>
        Fetch data for account ${dmAccount.userId}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.userId}.xlsx</a>
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
    for (let index = 5; index < accounts_1.dmAccounts.length; index++) {
        var startTime = performance.now();
        const dmAccount = accounts_1.dmAccounts[index];
        console.log("account :", dmAccount);
        let instaServive = new insta_service_1.default();
        yield instaServive.init(dmAccount.userId, dmAccount.password);
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
        let fetchAccount = accounts_1.fetchAccounts[index];
        yield instaServive.init(fetchAccount.userId, fetchAccount.password);
        yield instaServive.logIn({ cookieLogin: true, index: index + 100 });
        let userids = yield instaServive.fetchUserIdFromDmLinks(links.slice(0, 100));
        yield instaServive.dispose();
        const wb = xlsx_1.default.utils.book_new();
        const ws = xlsx_1.default.utils.json_to_sheet(userids);
        // Append the worksheet to the workbook
        xlsx_1.default.utils.book_append_sheet(wb, ws, "UserIDs");
        // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
        // Write the workbook to a file
        let filePath = path_1.default.join(__dirname, `${dmAccount.userId}.xlsx`);
        xlsx_1.default.writeFile(wb, filePath);
        const bucket = firebase_1.amdin.storage().bucket();
        yield bucket.upload(filePath, {
            destination: `insta-data/${dmAccount.userId}.xlsx`,
            metadata: {
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
        const file = bucket.file(`insta-data/${dmAccount.userId}.xlsx`);
        const [url] = yield file.getSignedUrl({
            action: "read",
            expires: "03-01-2500", // Set an appropriate expiration date
        });
        var endTime = performance.now();
        yield (0, resend_1.sendMail)(process.env.EMAIL, `Insta-report-${dmAccount.userId}`, `
      <div>
        Fetch data for account ${dmAccount.userId}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.userId}.xlsx</a>
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
        let fetchAccount = accounts_1.fetchAccounts[0];
        yield instaServive.init(fetchAccount.userId, fetchAccount.password);
        //   try {
        let page = yield instaServive.logIn({ cookieLogin: true });
        //     finaldata = await instaServive.scanDMs(page);
        // let links = Object.keys(dmFetchData).map(
        //   (dmData) => "https://www.instagram.com" + dmData
        // );
        // let userIds = await instaServive.fetchUserIdFromDmLinks(links);
        //   } catch (error) {
        //     console.log("error :", error);
        //   }
        // -------
        // setp 2
        // open the chat link and save the user Id
        console.log("hi there ");
        res.send({ userIds: {} });
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
