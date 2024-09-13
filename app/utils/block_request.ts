import path from "path";
import fs from "fs";
import { Page } from "puppeteer";

const blocked_domains = ["googlesyndication.com", "adservice.google.com"];

const mockPng = fs
  .readFileSync(path.join(__dirname, "..", "..", "images.png"))
  .toString("base64");

export const blockResourceRequest = async (page: Page) => {
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
  let client = await page.createCDPSession();
  await client.send("Network.setBlockedURLs", {
    urls: blocked_domains,
  });

  await client.send("Fetch.enable", {
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

  client.on("Fetch.requestPaused", async (e) => {
    if (e.resourceType === "Image" || e.resourceType === "Media") {
      client.send("Fetch.fulfillRequest", {
        requestId: e.requestId,
        responseCode: 200,
        body: mockPng,
      });
    } else {
      client.send("Fetch.continueRequest", {
        requestId: e.requestId,
      });
    }
  });

  await Promise.all([
    client.send("Console.disable"),
    client.send("ServiceWorker.disable"),
    client.send("CSS.disable"),
    client.send("Network.setBypassServiceWorker", { bypass: true }),
    client.send("Page.setBypassCSP", { enabled: true }),
  ]);
};
