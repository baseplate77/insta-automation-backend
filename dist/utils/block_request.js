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
exports.blockResourceRequest = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const blocked_domains = ["googlesyndication.com", "adservice.google.com"];
const mockPng = fs_1.default
    .readFileSync(path_1.default.join(__dirname, "..", "..", "images.png"))
    .toString("base64");
const blockResourceRequest = (page) => __awaiter(void 0, void 0, void 0, function* () {
    // await page.setRequestInterception(true)
    // page.on('request', request => {
    //   const url = request.url().toLowerCase();
    //   const resourceType = request.resourceType();
    //   // console.log("type :", resourceType);
    //   if (
    //     resourceType === 'media' ||
    //     resourceType === "image" ||
    //     resourceType === "other" ||
    //     // resourceType === "xhr" ||
    //     // resourceType === "stylesheet" ||
    //     resourceType === "font" ||
    //     url.endsWith('.mp4') ||
    //     url.endsWith('.avi') ||
    //     url.endsWith('.flv') ||
    //     url.endsWith('.mov') ||
    //     url.endsWith('.wmv')
    //   ) {
    //     // console.log(`ABORTING: ${resourceType}`);
    //     // request.abort();
    //     request.respond({ status: 200, body: 'aborted' })
    //   } else if (blocked_domains.some(domain => url.includes(domain))) {
    //     // console.log("AbORTIN : GOOGLE ADS SCRIPT");
    //     request.abort();
    //   }
    //   else {
    //     request.continue();
    //   }
    // });
    let client = yield page.createCDPSession();
    yield client.send("Network.setBlockedURLs", {
        urls: blocked_domains,
    });
    yield client.send("Fetch.enable", {
        patterns: [
            {
                resourceType: "Image",
                requestStage: "Request",
            },
            {
                resourceType: "Media",
                requestStage: "Request",
            },
            {
                urlPattern: "*.mp4",
                requestStage: "Request",
            },
            {
                urlPattern: "*.avi",
                requestStage: "Request",
            },
            {
                urlPattern: "*.flv",
                requestStage: "Request",
            },
            {
                urlPattern: "*.mov",
                requestStage: "Request",
            },
            {
                urlPattern: "*.wmv",
                requestStage: "Request",
            },
        ],
    });
    client.on("Fetch.requestPaused", (e) => __awaiter(void 0, void 0, void 0, function* () {
        if (e.resourceType === "Image" || e.resourceType === "Media") {
            client.send("Fetch.fulfillRequest", {
                requestId: e.requestId,
                responseCode: 200,
                body: mockPng,
            });
        }
        else {
            client.send("Fetch.continueRequest", {
                requestId: e.requestId,
            });
        }
    }));
    yield Promise.all([
        client.send("Console.disable"),
        client.send("ServiceWorker.disable"),
        client.send("CSS.disable"),
        client.send("Network.setBypassServiceWorker", { bypass: true }),
        client.send("Page.setBypassCSP", { enabled: true }),
    ]);
});
exports.blockResourceRequest = blockResourceRequest;
