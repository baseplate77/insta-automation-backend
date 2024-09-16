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
const browerSetup_1 = require("../utils/browerSetup");
const mouse_helper_1 = require("../utils/mouse-helper");
const ghost_cursor_1 = require("ghost-cursor");
const delay_1 = __importDefault(require("../utils/delay"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const block_request_1 = require("../utils/block_request");
class InstaService {
    init(userId, password) {
        return __awaiter(this, void 0, void 0, function* () {
            this.userId = userId;
            this.password = password;
            this.browser = yield browerSetup_1.globalBrowser.initBrower();
        });
    }
    turnOffNotificationClick(page, cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield page.waitForSelector("button", { timeout: 1000 });
                let btn = yield page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll("button"));
                    const button = buttons.find((btn) => btn.innerText.trim().toLocaleLowerCase() === "not now");
                    if (button) {
                        button.click();
                    }
                    return button ? button : null;
                });
            }
            catch (error) { }
            // if (btn) {
            //   let classname = btn.className.replace(/ /g, ".");
            //   console.log("found the button", classname);
            //   // if (cursor) {
            //   //   await cursor.click(`.${classname}`);
            //   // } else {
            //   btn.click();
            //   // }
            // }
        });
    }
    saveInfoNotNow(page, cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            let notNotSelector = "div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > div > div > div > div";
            let notNowButton = yield page.$(notNotSelector);
            if (notNowButton !== undefined || notNowButton !== null) {
                if (cursor) {
                    try {
                        yield cursor.click(notNotSelector);
                    }
                    catch (errro) {
                        yield (notNowButton === null || notNowButton === void 0 ? void 0 : notNowButton.click());
                    }
                }
                else
                    yield (notNowButton === null || notNowButton === void 0 ? void 0 : notNowButton.click());
                yield (0, delay_1.default)(1000);
                yield page.content();
                yield (0, delay_1.default)(2000);
            }
        });
    }
    fetchUserIdFromDmLinks(links_1) {
        return __awaiter(this, arguments, void 0, function* (links, batchSize = 2, linkPerAccount = 5) {
            // let batchSize = 2;
            let profileData = [];
            console.log("links :", links.length);
            for (let i = 0; i < links.length; i += batchSize) {
                let tempLinks = [...links];
                let batchLinks = tempLinks.splice(i, batchSize);
                console.log("batch Links :", batchLinks);
                console.log("current index :", i * batchSize);
                let promises = batchLinks.map((fetchData) => __awaiter(this, void 0, void 0, function* () {
                    let newPage = yield this.browser.newPage();
                    try {
                        let data = {};
                        yield newPage.goto(fetchData.link, { waitUntil: "networkidle2" });
                        yield this.turnOffNotificationClick(newPage);
                        let moreInfoIconElement = yield newPage.$("div > div.x1vjfegm > div > div > div > div > div > svg");
                        if (moreInfoIconElement !== undefined) {
                            console.log("clicking");
                            yield (moreInfoIconElement === null || moreInfoIconElement === void 0 ? void 0 : moreInfoIconElement.click());
                            yield (0, delay_1.default)(1000);
                            let profileLinkSeletor = "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1.x1bs97v6.x1q0q8m5.xso031l.x5ur3kl.x13fuv20.x178xt8z.x1t1x2f9.x1iyjqo2.xs83m0k.x6ikm8r.x10wlt62 > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.xw2csxc.x1odjw0f.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1.x1t1x2f9.x1iyjqo2.xs83m0k > a";
                            yield newPage.waitForSelector(profileLinkSeletor, {
                                timeout: 20000,
                            });
                            let chatUserElement = yield newPage.$(profileLinkSeletor);
                            let profileLink = chatUserElement
                                ? yield chatUserElement.evaluate((e) => e.href)
                                : "";
                            console.log("userId :", profileLink);
                            // get account country
                            if (profileLink !== "") {
                                data["profileUrl"] = profileLink;
                                data["userId"] = profileLink.split("/")[3];
                                data["dmLink"] = fetchData.link;
                                yield newPage.goto(profileLink, { waitUntil: "networkidle2" });
                                let accountCategorySelector = "div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1uhmqq1.x1xdureb.xo55r9g.x1vnunu7.x14tfgiu.xlrpkbc.xpoid6y.x16zxmhm.x6ikm8r.x10wlt62 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div";
                                try {
                                    yield newPage.waitForSelector(accountCategorySelector, {
                                        timeout: 5000,
                                    });
                                    let accountCategoryElement = yield newPage.$("div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1uhmqq1.x1xdureb.xo55r9g.x1vnunu7.x14tfgiu.xlrpkbc.xpoid6y.x16zxmhm.x6ikm8r.x10wlt62 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div");
                                    let accountCategory = accountCategoryElement !== null
                                        ? yield accountCategoryElement.evaluate((e) => e.innerText)
                                        : "";
                                    data["accountCategory"] = accountCategory;
                                }
                                catch (error) {
                                    data["accountCategory"] = "";
                                }
                                let moreInfoBtn = yield newPage.$("section > div > div > div:nth-child(3) > div > div > svg");
                                if (moreInfoBtn !== undefined) {
                                    yield (moreInfoBtn === null || moreInfoBtn === void 0 ? void 0 : moreInfoBtn.click());
                                    try {
                                        yield newPage.waitForSelector("div > button", {
                                            timeout: 5000,
                                        });
                                        let btn = yield newPage.evaluate(() => {
                                            const buttons = Array.from(document.querySelectorAll("button"));
                                            const button = buttons.find((btn) => btn.textContent.trim().toLocaleLowerCase() ===
                                                "about this account");
                                            if (button) {
                                                button.click();
                                            }
                                            return button ? button : null;
                                        });
                                        let buttons = yield newPage.$$("div > button");
                                        let aboutThisAccountBtn = undefined;
                                        for (let btn of buttons) {
                                            if (aboutThisAccountBtn === undefined) {
                                                let i = (yield btn.evaluate((t) => t.innerText)).toLocaleLowerCase();
                                                if (i === "about this account") {
                                                    aboutThisAccountBtn = btn;
                                                }
                                            }
                                        }
                                        if (aboutThisAccountBtn !== undefined) {
                                            yield (aboutThisAccountBtn === null || aboutThisAccountBtn === void 0 ? void 0 : aboutThisAccountBtn.click());
                                            (0, delay_1.default)(1000);
                                            try {
                                                let countrySelector = "div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > span:nth-child(2)";
                                                yield newPage.waitForSelector(countrySelector, {
                                                    timeout: 100000,
                                                });
                                                let countryElement = yield newPage.$(countrySelector);
                                                let countryName = countryElement
                                                    ? yield countryElement.evaluate((e) => e.innerText)
                                                    : "";
                                                data["country"] = countryName;
                                            }
                                            catch (error) {
                                                console.log("fail to find the account country element on profile page");
                                            }
                                        }
                                    }
                                    catch (eror) {
                                        console.log("fail to get the about this button on profile page");
                                    }
                                }
                                data = Object.assign(Object.assign({}, fetchData), data);
                                profileData.push(data);
                            }
                        }
                        console.log("profileData :", profileData);
                    }
                    catch (error) {
                        console.log("fail to get the profile data :", error);
                    }
                    finally {
                        yield (0, delay_1.default)(1000);
                        yield newPage.close();
                    }
                }));
                yield Promise.all([...promises]);
            }
            return profileData;
        });
    }
    sendDMAndFetchData(links_1) {
        return __awaiter(this, arguments, void 0, function* (links, sendMessage = true) {
            // send DMs
            let seenStatusSelector = "div.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xmz0i5r.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(2) > div > div > div > div.x78zum5.x13a6bvl.xvrgn94.x7ggn4r.xhepvqq > span";
            let msgListSelector = "div.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xmz0i5r.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div > div > div:nth-child(3) > div";
            let lastMsgDateSelector = "div.xjpr12u.xr9ek0c.x2b8uid > span > span";
            let userIdSelector = "div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x193iq5w.xeuugli.x1r8uery.x1iyjqo2.xs83m0k.xsyo7zv.x16hj40l.x10b6aqq.x1yrsyyn > a";
            let messageInputSelector = "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1i64zmx.xw3qccf.x1uhb9sk.x1plvlek.xryxfnj.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x1gh3ibb.xisnujt.xeuugli.x1odjw0f";
            let accountCategorySelector = "div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1uhmqq1.x1xdureb.xo55r9g.x1vnunu7.x14tfgiu.xlrpkbc.xpoid6y.x16zxmhm.x6ikm8r.x10wlt62 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div";
            let chatActiveTimeSelector = "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1gslohp.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > span";
            let hasSeenMsgSelector = "div > div.x78zum5.x13a6bvl.xvrgn94.x7ggn4r.xhepvqq > span";
            let hasRepliedSelector = "div > span > img";
            let userDetails = [];
            for (let i = 0; i < links.length; i++) {
                const link = links[i];
                let page = yield this.browser.newPage();
                try {
                    // await blockResourceRequest(page);
                    yield page.goto(link, { waitUntil: ["load", "networkidle2"] });
                    yield this.turnOffNotificationClick(page);
                    let cursor = (0, ghost_cursor_1.createCursor)(page);
                    yield page.waitForSelector(userIdSelector, { timeout: 5000 });
                    yield (0, delay_1.default)(500);
                    let profileUrl, userId, userName, accountCategory, country, seenStatus, lastMsgDate, hasReplied, hasSeenMsg, chatActiveTime;
                    // dm will not be send if hasReplied, hasSeenMsg is true or chatActive was active
                    try {
                        yield page.waitForSelector(msgListSelector, { timeout: 2000 });
                    }
                    catch (error) {
                        console.log("error in sendDmAndfetchData", error);
                    }
                    // console.log("message list loaded");
                    try {
                        let userIdElement = yield page.$(userIdSelector);
                        profileUrl =
                            userIdElement !== null || userIdElement !== undefined
                                ? yield (userIdElement === null || userIdElement === void 0 ? void 0 : userIdElement.evaluate((e) => e.href))
                                : "";
                        userId = profileUrl !== "" ? profileUrl.split("/")[3] : "";
                        userName =
                            userIdElement !== null || userIdElement !== undefined
                                ? yield (userIdElement === null || userIdElement === void 0 ? void 0 : userIdElement.evaluate((e) => e.innerText))
                                : "";
                        let seenStatusElement = yield page.$(seenStatusSelector);
                        seenStatus =
                            seenStatus !== null && seenStatus !== undefined
                                ? yield (seenStatusElement === null || seenStatusElement === void 0 ? void 0 : seenStatusElement.evaluate((e) => e.innerText))
                                : "";
                        let msgListElement = yield page.$(msgListSelector);
                        if (msgListElement !== null && msgListElement !== undefined) {
                            let msgList = (yield msgListElement.$$(":scope > *")).reverse();
                            let lastMsg = msgList[0];
                            let hasSeenElement = yield lastMsg.$(hasSeenMsgSelector);
                            hasSeenMsg =
                                hasSeenElement !== undefined
                                    ? yield (hasSeenElement === null || hasSeenElement === void 0 ? void 0 : hasSeenElement.evaluate((p) => p.innerText))
                                    : "";
                            let hasRepliedElement = yield lastMsg.$(hasRepliedSelector);
                            hasReplied =
                                hasRepliedElement !== undefined
                                    ? yield (hasRepliedElement === null || hasRepliedElement === void 0 ? void 0 : hasRepliedElement.evaluate((p) => p.innerText))
                                    : "";
                            for (let msg of msgList) {
                                let e = yield msg.$(lastMsgDateSelector);
                                if (e !== undefined && e !== null) {
                                    lastMsgDate = yield (e === null || e === void 0 ? void 0 : e.evaluate((p) => p.innerText));
                                    break;
                                }
                            }
                        }
                        let chatActiveElement = yield page.$(chatActiveTimeSelector);
                        chatActiveTime =
                            chatActiveElement !== undefined
                                ? yield (chatActiveElement === null || chatActiveElement === void 0 ? void 0 : chatActiveElement.evaluate((p) => p.innerText))
                                : "";
                        if (profileUrl !== undefined || profileUrl !== "") {
                            yield cursor.move(userIdSelector);
                            let newPage = yield this.browser.newPage();
                            let newCursor = (0, ghost_cursor_1.createCursor)(newPage);
                            yield (0, block_request_1.blockResourceRequest)(newPage);
                            yield newPage.goto(profileUrl, { waitUntil: "networkidle2" });
                            try {
                                yield newPage.waitForSelector(accountCategorySelector, {
                                    timeout: 2000,
                                });
                                let accountCategoryElement = yield newPage.$(accountCategorySelector);
                                accountCategory =
                                    accountCategoryElement !== null
                                        ? yield accountCategoryElement.evaluate((e) => e.innerText)
                                        : "";
                            }
                            catch (error) {
                                accountCategory = "";
                            }
                            let profileUserIdSelector = "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1h5jrl4.x1uhb9sk.x6ikm8r.x10wlt62.x1c4vz4f.xs83m0k.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > a > h2 > span";
                            let userIdElement = yield newPage.$(profileUserIdSelector);
                            if (userIdElement !== null && userIdElement !== undefined) {
                                yield newCursor.click(profileUserIdSelector);
                                try {
                                    let countrySelector = "div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > span:nth-child(2)";
                                    // await newPage.waitForSelector(countrySelector, {
                                    //   timeout: 2_0000,
                                    // });
                                    let countryElement = yield newPage.$(countrySelector);
                                    let countryName = countryElement
                                        ? yield countryElement.evaluate((e) => e.innerText)
                                        : "";
                                    country = countryName;
                                }
                                catch (error) {
                                    console.log("fail to find the account country element on profile page");
                                }
                            }
                            yield newPage.close();
                        }
                        let d = {
                            userIdUrl: profileUrl,
                            userId,
                            dmLink: link,
                            userName,
                            accountCategory,
                            country,
                            lastMsgDate,
                            chatActiveTime,
                            hasSeenMsg,
                            hasReplied,
                        };
                        userDetails.push(d);
                        console.log("details", d, userDetails.length);
                    }
                    catch (error) {
                        console.log("urserid is not finc for this :", link);
                        throw "not able to dm this user as it has been block";
                    }
                    // send message
                    if (sendMessage)
                        yield this.sendDM(page, "Just following up on my previous message. Have you had a chance to review my previous message? It’s important to address the issue promptly to restore your profile's growth. \n #Hurryup ⌛", userId, cursor);
                    // await page.waitForSelector(messageInputSelector, { timeout: 5_000 });
                    // let messageInputElement = await page.$(messageInputSelector);
                    // if (messageInputElement === null || messageInputElement === undefined)
                    //   throw "unable to loccate the message element";
                    // cursor.click(messageInputSelector);
                    // await messageInputElement.type(`Hi @${userId}`, { delay: 100 });
                    // await delay(500);
                    // await page.keyboard.press("Tab");
                    // await page.keyboard.press("Enter");
                    // await delay(2000);
                }
                catch (error) {
                    console.log("error :", error);
                }
                finally {
                    yield page.close();
                }
            }
            return userDetails;
        });
    }
    sendDM(page, msg, userId, cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let messageInputSelector = "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1i64zmx.xw3qccf.x1uhb9sk.x1plvlek.xryxfnj.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x1gh3ibb.xisnujt.xeuugli.x1odjw0f";
                // send message
                yield page.waitForSelector(messageInputSelector, { timeout: 2000 });
                let messageInputElement = yield page.$(messageInputSelector);
                if (messageInputElement === null || messageInputElement === undefined)
                    throw "unable to loccate the message element";
                cursor.click(messageInputSelector);
                // await messageInputElement.type(`hello @${userId}`, { delay: 200 });
                // await delay(200);
                // await page.keyboard.down("Shift");
                // await page.keyboard.press("Enter");
                // await delay(100); // Add a small delay to ensure the new line is created
                // await page.keyboard.press("Enter");
                // await delay(100); // Add a small delay to ensure the new line is created
                // await page.keyboard.up("Shift");
                // await delay(200);
                // // Ensure the cursor is at the correct position
                // await messageInputElement.click({ clickCount: 1 });
                // await delay(200);
                // tpying
                // let words = msg.split(" ");
                // for (let word of words) {
                //   if (word === "\n") {
                //     await page.keyboard.down("Shift");
                //     await page.keyboard.press("Enter");
                //     await delay(100);
                //     await page.keyboard.up("Shift");
                //   } else {
                //     await messageInputElement.type(word, { delay: 100 });
                //     await page.keyboard.press("Space");
                //     await delay(100);
                //   }
                // }
                // typing without delay
                yield (0, delay_1.default)(1500);
                yield messageInputElement.type(`hello `);
                yield (0, delay_1.default)(100);
                yield messageInputElement.type(`@${userId}`);
                yield (0, delay_1.default)(100);
                yield page.keyboard.down("Shift");
                yield (0, delay_1.default)(200);
                yield page.keyboard.press("Enter");
                yield (0, delay_1.default)(200); // Add a small delay to ensure the new line is created
                yield page.keyboard.press("Enter");
                yield (0, delay_1.default)(200); // Add a small delay to ensure the new line is created
                yield page.keyboard.up("Shift");
                yield (0, delay_1.default)(200);
                let words = msg.split(" ");
                for (let word of words) {
                    if (word === "\n") {
                        yield page.keyboard.down("Shift");
                        yield (0, delay_1.default)(200);
                        yield page.keyboard.press("Enter");
                        yield (0, delay_1.default)(200);
                        yield page.keyboard.up("Shift");
                    }
                    else {
                        yield messageInputElement.type(word);
                        yield messageInputElement.press("Space");
                    }
                }
                // let clipboardy = await import_("clipboardy");
                // // paste the message
                // clipboardy.writeSync(msg);
                // Paste the text using Ctrl+V
                yield (0, delay_1.default)(200);
                yield page.keyboard.press("Tab");
                yield (0, delay_1.default)(100);
                yield page.keyboard.press("Enter");
                yield (0, delay_1.default)(2000);
            }
            catch (error) {
                console.log("error :", error);
            }
        });
    }
    scanDMs(page) {
        return __awaiter(this, void 0, void 0, function* () {
            let finaldata = [];
            try {
                if (page === undefined)
                    throw "now auth page was provided";
                if (this.browser === undefined)
                    throw "browser not define";
                // await blockResourceRequest(page);
                // response monitoring
                page.on("response", (response) => __awaiter(this, void 0, void 0, function* () {
                    const url = response.url();
                    const status = response.status();
                    if (url.includes("bulk-route-definitions") && status === 200) {
                        let data = yield response.text();
                        let cleanData = data.replace(/^for \(\;\;\)\;/, "");
                        // Parse the cleaned JSON string
                        let jsonObject = JSON.parse(cleanData);
                        let request = response.request();
                        let payload = request.postData();
                        const params = new URLSearchParams(payload);
                        const jsonObject2 = {};
                        for (const [key, value] of params.entries()) {
                            const decodedKey = decodeURIComponent(key);
                            const decodedValue = decodeURIComponent(value);
                            // Handle nested keys like route_urls[0]
                            const keyMatch = decodedKey.match(/([^\[]+)\[([^\]]+)\]/);
                            if (keyMatch) {
                                const mainKey = keyMatch[1];
                                const subKey = keyMatch[2];
                                if (!jsonObject2[mainKey]) {
                                    jsonObject2[mainKey] = {};
                                }
                                jsonObject2[mainKey][subKey] = decodedValue;
                            }
                            else {
                                jsonObject2[decodedKey] = decodedValue;
                            }
                        }
                        if (jsonObject2["route_urls"] !== undefined) {
                            for (let index = 0; index < Object.values(jsonObject2["route_urls"]).length; index++) {
                                const inboxUrl = Object.values(jsonObject2["route_urls"])[index];
                                if (finaldata[inboxUrl] === undefined &&
                                    inboxUrl.includes("direct/t/")) {
                                    finaldata[inboxUrl] = {
                                        link: "https://www.instagram.com" + inboxUrl,
                                    };
                                }
                            }
                        }
                        if (jsonObject["payload"] !== undefined &&
                            jsonObject["payload"]["payloads"] !== undefined &&
                            /\d/.test(Object.keys(jsonObject["payload"]["payloads"])[0])) {
                            let inboxUrls = Object.keys(jsonObject["payload"]["payloads"]);
                            for (let index = 0; index < inboxUrls.length; index++) {
                                const inboxUrl = inboxUrls[index];
                                if (finaldata[inboxUrl] === undefined) {
                                    finaldata[inboxUrl] = {
                                        link: "https://www.instagram.com" + inboxUrl,
                                    };
                                }
                            }
                            // let inboxLinks = Object.keys(finaldata).map(
                            //   (d) => "https://www.instagram.com" + d
                            // );
                            // console.log("final data :", finaldata);
                            console.log(Object.keys(finaldata).length);
                            // console.log(Object.keys(jsonObject["payload"]["payloads"]));
                        }
                        console.log("-------------------------- \n\n");
                    }
                }));
                yield page.goto("https://www.instagram.com/direct/inbox/", {
                    timeout: 0,
                });
                // await delay(2000);
                // await delay(2000);
                // if login challenge is present select "not now"
                let url = page.url();
                // console.log("url :", url);
                let cursor = (0, ghost_cursor_1.createCursor)(page);
                if (url.includes("challenge/")) {
                    yield page.waitForSelector("form > div > div:nth-child(2)");
                    let thatWasMeBtn = yield page.$("form > div > div:nth-child(2)");
                    if (thatWasMeBtn) {
                        yield cursor.click("form > div > div:nth-child(2)");
                        // await thatWasMeBtn?.click();
                    }
                    // await page.content();
                }
                yield page.waitForSelector('[aria-label="Thread list"]');
                yield (0, delay_1.default)(1000);
                // turn on notification dialoag handler ( CLICK NOT NOW )
                yield this.turnOffNotificationClick(page, cursor);
                yield (0, delay_1.default)(100);
                // await page.evaluate(() => {
                //   const buttons = Array.from(document.querySelectorAll("button"));
                //   const button = buttons.find(
                //     (btn) => btn.innerText.trim() === "Not Now"
                //   );
                //   if (button) {
                //     console.log("found the button");
                //     button.click();
                //   }
                //   return button ? button.getAttribute("outerHTML") : null;
                // });
                // Get the bounding box of the section/div with aria-label="Thread list"
                const threadListSection = yield page.$('[aria-label="Thread list"]');
                const boundingBox = yield threadListSection.boundingBox();
                console.log("boundingBox :", boundingBox);
                // let cursor = createCursor(page);
                // await page.mouse.move(
                //   boundingBox!.x + boundingBox!.width / 2,
                //   boundingBox!.y + boundingBox!.height / 2
                // );
                yield cursor.moveTo({
                    x: boundingBox.x + boundingBox.width / 2,
                    y: boundingBox.y + boundingBox.height / 2,
                });
                let loadingDivSelector = '[aria-label="Loading..."]';
                let loadingDiv = yield (threadListSection === null || threadListSection === void 0 ? void 0 : threadListSection.$(loadingDivSelector));
                let limit = 20;
                let i = 0;
                let previoursObjectLeng = -99;
                let repeatedSameValue = 0;
                while (loadingDiv !== null && loadingDiv !== undefined) {
                    loadingDiv = yield page.$(loadingDivSelector);
                    // get the chat user name , active status or last message time
                    // let chatsDiv = await page.$('[aria-label="Chats"]');
                    // let dmListDiv = await chatsDiv!.$(
                    //   "div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xeuugli.xvbhtw8 > div > div.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div:nth-child(2) > div"
                    // );
                    // let dmChildNodes = await dmListDiv?.$$(":scope > *");
                    let keys = Object.keys(finaldata);
                    console.log("scan links count :", keys.length);
                    if (previoursObjectLeng === keys.length) {
                        if (repeatedSameValue === 5)
                            break;
                        repeatedSameValue++;
                    }
                    else {
                        repeatedSameValue = 0;
                        previoursObjectLeng = keys.length;
                    }
                    // for (let index = 0; index < dmChildNodes!.length; index++) {
                    //   // data already exist return
                    //   if (
                    //     finaldata[keys[index]] !== undefined &&
                    //     finaldata[keys[index]]["userName"] === undefined &&
                    //     keys.length > index
                    //   ) {
                    //     try {
                    //       const element = dmChildNodes![index];
                    //       await element.scrollIntoView();
                    //       await delay(300);
                    //       let userNameSelector =
                    //         "span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.xo1l8bm.x5n08af.x1tu3fi.x3x7a5m.x10wh9bi.x1wdrske.x8viiok.x18hxmgj > span";
                    //       let userName;
                    //       try {
                    //         // element.waitForSelector(userNameSelector, { timeout: 5_000 });
                    //         userName = await element.$eval(
                    //           userNameSelector,
                    //           (e: any) => e.innerText
                    //         );
                    //       } catch (error) {
                    //         console.log("error :", error);
                    //         userName = "";
                    //       }
                    //       let lastActiveElement = await element.$(
                    //         "div > div:nth-child(3) > div > span > span"
                    //       );
                    //       let lastActive = lastActiveElement
                    //         ? await lastActiveElement.evaluate((e) => e.innerText)
                    //         : "";
                    //       lastActive = lastActive.toLocaleLowerCase().includes("active")
                    //         ? lastActive.split("\n")[1]
                    //         : "";
                    //       let lastMsgDateElement = await element.$(
                    //         "div > div:nth-child(3) > div > div > span > span > div > span"
                    //       );
                    //       let lastMsgDate = lastMsgDateElement
                    //         ? await lastMsgDateElement.evaluate((e) => e.innerText)
                    //         : "";
                    //       finaldata[keys[index]] = {
                    //         userName,
                    //         lastActive,
                    //         lastMsgDate,
                    //         ...finaldata[keys[index]],
                    //       };
                    //       console.log("found data of ", index, keys[index]);
                    //       // console.log(
                    //       //   index,
                    //       //   "data :",
                    //       //   userName,
                    //       //   "\n",
                    //       //   lastActive,
                    //       //   "\n",
                    //       //   lastMsgDate
                    //       // );
                    //     } catch (error) {
                    //       finaldata[keys[index]] = {
                    //         userName: "",
                    //         lastActive: "",
                    //         lastMsgDate: "",
                    //         ...finaldata[keys[index]],
                    //       };
                    //       console.log(
                    //         "error :",
                    //         index,
                    //         keys.length > index ? keys[index] : "index is higher than key",
                    //         "\n",
                    //         error
                    //       );
                    //     }
                    //   }
                    // }
                    // scroll to fetch new dm
                    let randomdelay = Math.random() * 3 + 1;
                    yield (0, delay_1.default)(randomdelay * 500);
                    let randomScroll = Math.floor(Math.random() * 6) + 4;
                    yield page.mouse.wheel({ deltaY: randomScroll * 100 });
                    // loadingDiv = await page.$('[aria-label="Loading..."]');
                    i++;
                }
                console.log("end of while loop");
                return finaldata;
            }
            catch (error) {
                console.log("error in scan Dms :", error);
                throw error;
            }
        });
    }
    logIn(_a) {
        return __awaiter(this, arguments, void 0, function* ({ cookieLogin = true, index, }) {
            if (this.userId === "" && this.userId === undefined)
                throw "userid is not define";
            if (this.password === "" && this.password === undefined)
                throw "password is not define";
            try {
                let page = yield this.browser.newPage();
                yield (0, mouse_helper_1.installMouseHelper)(page);
                if (cookieLogin &&
                    fs_1.default.existsSync(path_1.default.join(__dirname, `cookies-${index}.json`))) {
                    const cookies = JSON.parse(fs_1.default.readFileSync(path_1.default.join(__dirname, `cookies-${index}.json`), "utf-8"));
                    yield page.setCookie(...cookies);
                    // Refresh the page or navigate to ensure cookies are applied
                    yield page.goto("https://www.instagram.com/", {
                        waitUntil: "networkidle2",
                    });
                }
                else {
                    console.log("No cookies file found. Please login first to save cookies.");
                    yield page.goto("https://www.instagram.com/", {
                        waitUntil: ["load", "networkidle0"],
                        timeout: 900000,
                    });
                    let cursor = (0, ghost_cursor_1.createCursor)(page);
                    yield cursor.click('input[name="username"]');
                    // login using password
                    yield page.type('input[name="username"]', this.userId, {
                        delay: 100,
                    });
                    yield (0, delay_1.default)(1000);
                    yield page.type('input[name="password"]', this.password, {
                        delay: 100,
                    });
                    // await delay(500);
                    cursor.click('button[type="submit"]');
                    // await page.click('button[type="submit"]');
                    yield page.waitForNavigation({ timeout: 0 });
                    console.log("Login successful!");
                    // await delay(1000);
                    console.log("saving the cookies");
                    // Save cookies to a file or database
                    const cookies = yield page.cookies();
                    // if (setCookie) {
                    //   setCookie(cookies);
                    // }
                    const cookieFilePath = path_1.default.join(__dirname, `cookies-${index !== null && index !== void 0 ? index : 0}.json`);
                    try {
                        fs_1.default.writeFileSync(cookieFilePath, JSON.stringify(cookies));
                        console.log("Cookies saved!");
                    }
                    catch (error) {
                        console.error("Error saving cookies:", error);
                    }
                    yield this.saveInfoNotNow(page, cursor);
                    yield page.waitForSelector("section > main", { timeout: 0 });
                    yield (0, delay_1.default)(1000);
                }
                return page;
            }
            catch (error) {
                console.log("error in login the user", error);
                throw error;
            }
        });
    }
    dblogIn(_a) {
        return __awaiter(this, arguments, void 0, function* ({ cookieLogin = true, cookie, setCookie, }) {
            if (this.userId === "" && this.userId === undefined)
                throw "userid is not define";
            if (this.password === "" && this.password === undefined)
                throw "password is not define";
            try {
                let page = yield this.browser.newPage();
                yield (0, mouse_helper_1.installMouseHelper)(page);
                if (cookieLogin &&
                    cookie
                // fs.existsSync(path.join(__dirname, `cookies-${index}.json`))
                ) {
                    // const cookies = JSON.parse(
                    //   fs.readFileSync(
                    //     path.join(__dirname, `cookies-${index}.json`),
                    //     "utf-8"
                    //   )
                    // );
                    yield page.setCookie(...cookie);
                    // Refresh the page or navigate to ensure cookies are applied
                    yield page.goto("https://www.instagram.com/", {
                        waitUntil: "networkidle2",
                    });
                }
                else {
                    console.log("No cookies file found. Please login first to save cookies.");
                    yield page.goto("https://www.instagram.com/", {
                        waitUntil: ["load", "networkidle0"],
                        timeout: 900000,
                    });
                    let cursor = (0, ghost_cursor_1.createCursor)(page);
                    yield cursor.click('input[name="username"]');
                    // login using password
                    yield page.type('input[name="username"]', this.userId, {
                        delay: 100,
                    });
                    yield (0, delay_1.default)(1000);
                    yield page.type('input[name="password"]', this.password, {
                        delay: 100,
                    });
                    // await delay(500);
                    cursor.click('button[type="submit"]');
                    // await page.click('button[type="submit"]');
                    yield page.waitForNavigation({ timeout: 0 });
                    console.log("Login successful!");
                    // await delay(1000);
                    console.log("saving the cookies");
                    // Save cookies to a file or database
                    const cookies = yield page.cookies();
                    if (setCookie) {
                        setCookie(cookies);
                    }
                    // const cookieFilePath = path.join(
                    //   __dirname,
                    //   `cookies-${index ?? 0}.json`
                    // );
                    try {
                        // fs.writeFileSync(cookieFilePath, JSON.stringify(cookies));
                        console.log("Cookies saved!");
                    }
                    catch (error) {
                        console.error("Error saving cookies:", error);
                    }
                    yield this.saveInfoNotNow(page, cursor);
                    yield page.waitForSelector("section > main", { timeout: 0 });
                    yield (0, delay_1.default)(1000);
                }
                return page;
            }
            catch (error) {
                console.log("error in login the user", error);
                throw error;
            }
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser === undefined)
                return;
            let pages = yield this.browser.pages();
            if (pages.length !== 0) {
                let pagePromise = pages.map((page) => __awaiter(this, void 0, void 0, function* () { return yield page.close(); }));
                yield Promise.all([pagePromise]);
            }
            yield this.browser.close();
        });
    }
}
exports.default = InstaService;
