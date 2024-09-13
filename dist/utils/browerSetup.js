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
exports.puppeteerManager = exports.globalBrowser = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const puppeteer_extra_1 = require("puppeteer-extra");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const puppeteer_extra_plugin_recaptcha_1 = __importDefault(require("puppeteer-extra-plugin-recaptcha"));
const constants_1 = require("./constants");
// let browser: Browser = undefined;
class PuppeteerManager {
    constructor() {
        this.browser = null;
        this.pageCount = 0;
        this.browser = null;
        this.pageCount = 0;
    }
    getBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.browser) {
                console.log("Launching new browser instance...");
                const puppeteer = (0, puppeteer_extra_1.addExtra)(puppeteer_1.default);
                puppeteer.use((0, puppeteer_extra_plugin_stealth_1.default)());
                // puppeteer.use(Recaptcha());
                // puppeteer.use(
                //   AdblockerPlugin({
                //     // blockTrackers: true,
                //     interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
                //   })
                // );
                const randomProxy = constants_1.proxyList[Math.floor(Math.random() * constants_1.proxyList.length)];
                this.browser = yield puppeteer.launch({
                    // executablePath: "/usr/bin/google-chrome",
                    // ignoreHTTPSErrors: true,
                    protocolTimeout: 0,
                    timeout: 0,
                    // targetFilter: (target) => {
                    //   if (target.type() === "page") return true;
                    //   // try {
                    //   //   if (turnstile === true && target._getTargetInfo().type == "iframe")
                    //   //     return false;
                    //   // } catch (err) {}
                    //   // if (global_target_status === false) return true;
                    //   var response = false;
                    //   // try {
                    //   //   response = !!target.url();
                    //   //   if (
                    //   //     [].find((item) =>
                    //   //       String(target.url()).indexOf(String(item) > -1)
                    //   //     )
                    //   //   ) {
                    //   //     response = true;
                    //   //   }
                    //   // } catch (err) {}
                    //   return response;
                    // },
                    // headless: true,
                    headless: false,
                    args: ["--no-sandbox", "--disable-setuid-sandbox"],
                    // args: [
                    //   "--disable-gpu",
                    //   "--disable-setuid-sandbox",
                    //   "--no-first-run",
                    //   "--no-sandbox",
                    //   "--no-zygote",
                    //   "--deterministic-fetch",
                    //   "--disable-features=IsolateOrigins",
                    //   "--disable-site-isolation-trials",
                    //   "--window-size=1920,1080",
                    //   "--auto-open-devtools-for-tabs",
                    //   // `--proxy-server=${randomProxy}`,
                    //   // "--disable-gpu",
                    //   // "--disable-dev-shm-usage",
                    //   // "--disable-setuid-sandbox",
                    //   // "--no-sandbox",
                    // ],
                });
            }
            else {
                console.log("Reusing existing browser instance...");
            }
            return this.browser;
        });
    }
    // Create a new page in the existing browser
    createPage() {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield this.getBrowser();
            const page = yield browser.newPage();
            this.pageCount += 1;
            console.log(`Page created. Current page count: ${this.pageCount}`);
            return page;
        });
    }
    // Close the page and check if the browser should be closed
    closePage(page) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!page)
                return;
            yield page.close();
            this.pageCount -= 1;
            console.log(`Page closed. Current page count: ${this.pageCount}`);
            if (this.pageCount === 0 && this.browser) {
                console.log("Closing browser as there are no more pages...");
                yield this.browser.close();
                this.browser = null;
            }
        });
    }
}
class GlobalBroswer {
    constructor() {
        this.initBrower = () => __awaiter(this, void 0, void 0, function* () {
            const puppeteer = (0, puppeteer_extra_1.addExtra)(puppeteer_1.default);
            puppeteer.use((0, puppeteer_extra_plugin_stealth_1.default)());
            puppeteer.use((0, puppeteer_extra_plugin_recaptcha_1.default)());
            // puppeteer.use(
            //   AdblockerPlugin({
            //     // blockTrackers: true,
            //     interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
            //   })
            // );
            // const randomProxy = proxyList[Math.floor(Math.random() * proxyList.length)];
            this.browser = yield puppeteer.launch({
                executablePath: "/usr/bin/google-chrome",
                // ignoreHTTPSErrors: true,
                protocolTimeout: 0,
                timeout: 0,
                // headless: true,
                headless: false,
                args: [
                    "--disable-gpu",
                    "--disable-setuid-sandbox",
                    "--no-first-run",
                    "--no-sandbox",
                    "--no-zygote",
                    "--deterministic-fetch",
                    "--disable-features=IsolateOrigins",
                    "--disable-site-isolation-trials",
                    "--disable-blink-features=AutomationControlled",
                    // `--proxy-server=${randomProxy}`,
                    // "--disable-gpu",
                    // "--disable-dev-shm-usage",
                    // "--disable-setuid-sandbox",
                    // "--no-sandbox",
                ],
            });
            console.log("Browser has been started");
            return this.browser;
        });
        // this.initBrower();
    }
    static getInstance() {
        return this._instance || (this._instance = new this());
    }
    getBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser !== undefined)
                return this.browser;
        });
    }
}
exports.globalBrowser = GlobalBroswer.getInstance();
exports.puppeteerManager = new PuppeteerManager();
