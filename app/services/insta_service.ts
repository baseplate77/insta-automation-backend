import { Browser, Page } from "puppeteer";
import { globalBrowser } from "../utils/browerSetup";
import { installMouseHelper } from "../utils/mouse-helper";
import { createCursor, GhostCursor } from "ghost-cursor";
import delay from "../utils/delay";
import import_ from "@brillout/import";
import fs from "fs";
import path from "path";
import { blockResourceRequest } from "../utils/block_request";
import { Cursor } from "mongoose";
import { chatAccountModel } from "../db/schema/chatAccount.schema";

class InstaService {
  private userId!: string;
  private password!: string;
  browser!: Browser;

  async init(userId: string, password: string) {
    this.userId = userId;
    this.password = password;
    this.browser = await globalBrowser.initBrower();
  }

  async turnOffNotificationClick(page: Page, cursor?: GhostCursor) {
    try {
      await page.waitForSelector("button", { timeout: 1_000 });

      let btn = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const button = buttons.find(
          (btn) => btn.innerText.trim().toLocaleLowerCase() === "not now"
        );
        if (button) {
          button.click();
        }
        return button ? button : null;
      });
    } catch (error) {}
    // if (btn) {
    //   let classname = btn.className.replace(/ /g, ".");
    //   console.log("found the button", classname);
    //   // if (cursor) {
    //   //   await cursor.click(`.${classname}`);
    //   // } else {
    //   btn.click();
    //   // }
    // }
  }
  async saveInfoNotNow(page: Page, cursor?: GhostCursor) {
    let notNotSelector =
      "div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > div > div > div > div";
    let notNowButton = await page.$(notNotSelector);
    if (notNowButton !== undefined || notNowButton !== null) {
      if (cursor) {
        try {
          await cursor.click(notNotSelector);
        } catch (errro) {
          await notNowButton?.click();
        }
      } else await notNowButton?.click();
      await delay(1000);
      await page.content();
      await delay(2000);
    }
  }
  async fetchUserIdFromDmLinks(
    links: any[],
    batchSize = 2,
    linkPerAccount = 5
  ) {
    // let batchSize = 2;
    let profileData: any = [];
    console.log("links :", links.length);

    for (let i = 0; i < links.length; i += batchSize) {
      let tempLinks = [...links];
      let batchLinks = tempLinks.splice(i, batchSize);
      console.log("batch Links :", batchLinks);
      console.log("current index :", i * batchSize);

      let promises = batchLinks.map(async (fetchData) => {
        let newPage = await this.browser.newPage();
        try {
          let data: any = {};
          await newPage.goto(fetchData.link, { waitUntil: "networkidle2" });
          await this.turnOffNotificationClick(newPage);
          let moreInfoIconElement = await newPage.$(
            "div > div.x1vjfegm > div > div > div > div > div > svg"
          );
          if (moreInfoIconElement !== undefined) {
            console.log("clicking");

            await moreInfoIconElement?.click();
            await delay(1000);
            let profileLinkSeletor =
              "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1.x1bs97v6.x1q0q8m5.xso031l.x5ur3kl.x13fuv20.x178xt8z.x1t1x2f9.x1iyjqo2.xs83m0k.x6ikm8r.x10wlt62 > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1uhb9sk.xw2csxc.x1odjw0f.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1.x1t1x2f9.x1iyjqo2.xs83m0k > a";
            await newPage.waitForSelector(profileLinkSeletor, {
              timeout: 20_000,
            });
            let chatUserElement = await newPage.$(profileLinkSeletor);
            let profileLink = chatUserElement
              ? await chatUserElement.evaluate((e: any) => e.href)
              : "";
            console.log("userId :", profileLink);
            // get account country
            if (profileLink !== "") {
              data["profileUrl"] = profileLink;
              data["userId"] = profileLink.split("/")[3];
              data["dmLink"] = fetchData.link;

              await newPage.goto(profileLink, { waitUntil: "networkidle2" });

              let accountCategorySelector =
                "div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1uhmqq1.x1xdureb.xo55r9g.x1vnunu7.x14tfgiu.xlrpkbc.xpoid6y.x16zxmhm.x6ikm8r.x10wlt62 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div";
              try {
                await newPage.waitForSelector(accountCategorySelector, {
                  timeout: 5_000,
                });
                let accountCategoryElement = await newPage.$(
                  "div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1uhmqq1.x1xdureb.xo55r9g.x1vnunu7.x14tfgiu.xlrpkbc.xpoid6y.x16zxmhm.x6ikm8r.x10wlt62 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div"
                );

                let accountCategory =
                  accountCategoryElement !== null
                    ? await accountCategoryElement.evaluate((e) => e.innerText)
                    : "";
                data["accountCategory"] = accountCategory;
              } catch (error) {
                data["accountCategory"] = "";
              }
              let moreInfoBtn = await newPage.$(
                "section > div > div > div:nth-child(3) > div > div > svg"
              );

              if (moreInfoBtn !== undefined) {
                await moreInfoBtn?.click();
                try {
                  await newPage.waitForSelector("div > button", {
                    timeout: 5_000,
                  });
                  let btn = await newPage.evaluate(() => {
                    const buttons = Array.from(
                      document.querySelectorAll("button")
                    );
                    const button = buttons.find(
                      (btn) =>
                        btn.textContent!.trim().toLocaleLowerCase() ===
                        "about this account"
                    );
                    if (button) {
                      button.click();
                    }
                    return button ? button : null;
                  });
                  let buttons = await newPage.$$("div > button");

                  let aboutThisAccountBtn = undefined;

                  for (let btn of buttons) {
                    if (aboutThisAccountBtn === undefined) {
                      let i = (
                        await btn.evaluate((t) => t.innerText)
                      ).toLocaleLowerCase();
                      if (i === "about this account") {
                        aboutThisAccountBtn = btn;
                      }
                    }
                  }

                  if (aboutThisAccountBtn !== undefined) {
                    await aboutThisAccountBtn?.click();
                    delay(1000);
                    try {
                      let countrySelector =
                        "div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > span:nth-child(2)";

                      await newPage.waitForSelector(countrySelector, {
                        timeout: 10_0000,
                      });

                      let countryElement = await newPage.$(countrySelector);
                      let countryName = countryElement
                        ? await countryElement.evaluate((e: any) => e.innerText)
                        : "";

                      data["country"] = countryName;
                    } catch (error) {
                      console.log(
                        "fail to find the account country element on profile page"
                      );
                    }
                  }
                } catch (eror) {
                  console.log(
                    "fail to get the about this button on profile page"
                  );
                }
              }
              data = {
                ...fetchData,
                ...data,
              };
              profileData.push(data);
            }
          }

          console.log("profileData :", profileData);
        } catch (error) {
          console.log("fail to get the profile data :", error);
        } finally {
          await delay(1000);
          await newPage.close();
        }
      });
      await Promise.all([...promises]);
    }

    return profileData;
  }

  async sendDMAndFetchData(links: string[], sendMessage = true) {
    // send DMs

    let seenStatusSelector =
      "div.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xmz0i5r.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(2) > div > div > div > div.x78zum5.x13a6bvl.xvrgn94.x7ggn4r.xhepvqq > span";
    let msgListSelector =
      "div.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xmz0i5r.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div > div > div:nth-child(3) > div";

    let lastMsgDateSelector = "div.xjpr12u.xr9ek0c.x2b8uid > span > span";

    let userIdSelector =
      "div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x193iq5w.xeuugli.x1r8uery.x1iyjqo2.xs83m0k.xsyo7zv.x16hj40l.x10b6aqq.x1yrsyyn > a";
    let messageInputSelector =
      "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1i64zmx.xw3qccf.x1uhb9sk.x1plvlek.xryxfnj.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x1gh3ibb.xisnujt.xeuugli.x1odjw0f";
    let accountCategorySelector =
      "div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1uhmqq1.x1xdureb.xo55r9g.x1vnunu7.x14tfgiu.xlrpkbc.xpoid6y.x16zxmhm.x6ikm8r.x10wlt62 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div";

    let chatActiveTimeSelector =
      "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1gslohp.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > span";
    let hasSeenMsgSelector =
      "div > div.x78zum5.x13a6bvl.xvrgn94.x7ggn4r.xhepvqq > span";
    let hasRepliedSelector = "div > span > img";
    let userDetails: any[] = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      let page = await this.browser.newPage();
      try {
        // await blockResourceRequest(page);

        await page.goto(link, { waitUntil: ["load", "networkidle2"] });
        await this.turnOffNotificationClick(page);
        let cursor = createCursor(page);
        await page.waitForSelector(userIdSelector, { timeout: 5_000 });
        await delay(500);
        let profileUrl,
          userId,
          userName,
          accountCategory,
          country,
          seenStatus,
          lastMsgDate,
          hasReplied,
          hasSeenMsg,
          chatActiveTime;

        // dm will not be send if hasReplied, hasSeenMsg is true or chatActive was active

        try {
          await page.waitForSelector(msgListSelector, { timeout: 2_000 });
        } catch (error) {
          console.log("error in sendDmAndfetchData", error);
        }
        // console.log("message list loaded");

        try {
          let userIdElement = await page.$(userIdSelector);

          profileUrl =
            userIdElement !== null || userIdElement !== undefined
              ? await userIdElement?.evaluate((e: any) => e.href)
              : "";

          userId = profileUrl !== "" ? profileUrl.split("/")[3] : "";
          userName =
            userIdElement !== null || userIdElement !== undefined
              ? await userIdElement?.evaluate((e: any) => e.innerText)
              : "";

          let seenStatusElement = await page.$(seenStatusSelector);
          seenStatus =
            seenStatus !== null && seenStatus !== undefined
              ? await seenStatusElement?.evaluate((e: any) => e.innerText)
              : "";

          let msgListElement = await page.$(msgListSelector);
          if (msgListElement !== null && msgListElement !== undefined) {
            let msgList = (await msgListElement.$$(":scope > *")).reverse();
            let lastMsg = msgList[0];

            let hasSeenElement = await lastMsg.$(hasSeenMsgSelector);

            hasSeenMsg =
              hasSeenElement !== undefined
                ? await hasSeenElement?.evaluate((p: any) => p.innerText)
                : "";

            let hasRepliedElement = await lastMsg.$(hasRepliedSelector);
            hasReplied =
              hasRepliedElement !== undefined
                ? await hasRepliedElement?.evaluate((p: any) => p.innerText)
                : "";

            for (let msg of msgList) {
              let e = await msg.$(lastMsgDateSelector);
              if (e !== undefined && e !== null) {
                lastMsgDate = await e?.evaluate((p: any) => p.innerText);
                break;
              }
            }
          }

          let chatActiveElement = await page.$(chatActiveTimeSelector);

          chatActiveTime =
            chatActiveElement !== undefined
              ? await chatActiveElement?.evaluate((p: any) => p.innerText)
              : "";

          if (profileUrl !== undefined || profileUrl !== "") {
            await cursor.move(userIdSelector);

            let newPage = await this.browser.newPage();
            let newCursor = createCursor(newPage);
            await blockResourceRequest(newPage);
            await newPage.goto(profileUrl, { waitUntil: "networkidle2" });

            try {
              await newPage.waitForSelector(accountCategorySelector, {
                timeout: 2_000,
              });

              let accountCategoryElement = await newPage.$(
                accountCategorySelector
              );

              accountCategory =
                accountCategoryElement !== null
                  ? await accountCategoryElement.evaluate(
                      (e: any) => e.innerText
                    )
                  : "";
            } catch (error) {
              accountCategory = "";
            }
            let profileUserIdSelector =
              "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1h5jrl4.x1uhb9sk.x6ikm8r.x10wlt62.x1c4vz4f.xs83m0k.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > a > h2 > span";

            let userIdElement = await newPage.$(profileUserIdSelector);

            if (userIdElement !== null && userIdElement !== undefined) {
              await newCursor.click(profileUserIdSelector);
              try {
                let countrySelector =
                  "div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > span:nth-child(2)";

                // await newPage.waitForSelector(countrySelector, {
                //   timeout: 2_0000,
                // });

                let countryElement = await newPage.$(countrySelector);
                let countryName = countryElement
                  ? await countryElement.evaluate((e: any) => e.innerText)
                  : "";

                country = countryName;
              } catch (error) {
                console.log(
                  "fail to find the account country element on profile page"
                );
              }
            }

            await newPage.close();
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
        } catch (error) {
          console.log("urserid is not finc for this :", link);
          throw "not able to dm this user as it has been block";
        }

        // send message
        if (sendMessage)
          await this.sendDM(
            page,
            "Just following up on my previous message. Have you had a chance to review my previous message? It’s important to address the issue promptly to restore your profile's growth. \n #Hurryup ⌛",
            userId,
            cursor
          );

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
      } catch (error) {
        console.log("error :", error);
      } finally {
        await page.close();
      }
    }

    return userDetails;
  }
  async sendDM(page: Page, msg: string, userId: string, cursor: any) {
    try {
      let messageInputSelector =
        "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1i64zmx.xw3qccf.x1uhb9sk.x1plvlek.xryxfnj.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x1gh3ibb.xisnujt.xeuugli.x1odjw0f";
      // send message
      await page.waitForSelector(messageInputSelector, { timeout: 2_000 });

      let messageInputElement = await page.$(messageInputSelector);

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
      await delay(1500);
      await messageInputElement.type(`hello `);
      await delay(100);
      await messageInputElement.type(`@${userId}`);
      await delay(100);
      await page.keyboard.down("Shift");
      await delay(200);
      await page.keyboard.press("Enter");
      await delay(200); // Add a small delay to ensure the new line is created
      await page.keyboard.press("Enter");
      await delay(200); // Add a small delay to ensure the new line is created
      await page.keyboard.up("Shift");
      await delay(200);
      let words = msg.split(" ");
      for (let word of words) {
        if (word === "\n") {
          await page.keyboard.down("Shift");
          await delay(200);
          await page.keyboard.press("Enter");
          await delay(200);
          await page.keyboard.up("Shift");
        } else {
          await messageInputElement.type(word);
          await messageInputElement.press("Space");
        }
      }

      // let clipboardy = await import_("clipboardy");
      // // paste the message
      // clipboardy.writeSync(msg);
      // Paste the text using Ctrl+V

      await delay(200);
      await page.keyboard.press("Tab");
      await delay(100);
      await page.keyboard.press("Enter");
      await delay(2000);
    } catch (error) {
      console.log("error :", error);
    }
  }

  async scanDMs(page?: Page) {
    let finaldata: any = [];
    try {
      if (page === undefined) throw "now auth page was provided";
      if (this.browser === undefined) throw "browser not define";
      // await blockResourceRequest(page);
      // response monitoring
      page.on("response", async (response) => {
        const url = response.url() as string;
        const status = response.status();

        if (url.includes("bulk-route-definitions") && status === 200) {
          let data = await response.text();
          let cleanData = data.replace(/^for \(\;\;\)\;/, "");

          // Parse the cleaned JSON string
          let jsonObject = JSON.parse(cleanData);
          let request = response.request();
          let payload = request.postData();

          const params = new URLSearchParams(payload);
          const jsonObject2: any = {};
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
            } else {
              jsonObject2[decodedKey] = decodedValue;
            }
          }

          if (jsonObject2["route_urls"] !== undefined) {
            for (
              let index = 0;
              index < Object.values(jsonObject2["route_urls"]).length;
              index++
            ) {
              const inboxUrl = Object.values(jsonObject2["route_urls"])[
                index
              ] as string;
              if (
                finaldata[inboxUrl] === undefined &&
                inboxUrl.includes("direct/t/")
              ) {
                finaldata[inboxUrl] = {
                  link: "https://www.instagram.com" + inboxUrl,
                };
              }
            }
          }

          if (
            jsonObject["payload"] !== undefined &&
            jsonObject["payload"]["payloads"] !== undefined &&
            /\d/.test(Object.keys(jsonObject["payload"]["payloads"])[0])
          ) {
            let inboxUrls = Object.keys(jsonObject["payload"]["payloads"]);

            for (let index = 0; index < inboxUrls.length; index++) {
              const inboxUrl = inboxUrls[index] as any;
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
      });

      await page.goto("https://www.instagram.com/direct/inbox/", {
        timeout: 0,
      });

      // await delay(2000);
      // await delay(2000);
      // if login challenge is present select "not now"
      let url = page.url();
      // console.log("url :", url);
      let cursor = createCursor(page);

      if (url.includes("challenge/")) {
        await page.waitForSelector("form > div > div:nth-child(2)", {
          timeout: 120_000,
        });

        let thatWasMeBtn = await page.$("form > div > div:nth-child(2)");
        if (thatWasMeBtn) {
          await cursor.click("form > div > div:nth-child(2)");
          // await thatWasMeBtn?.click();
        }

        // await page.content();
      }

      await page.waitForSelector('[aria-label="Thread list"]');

      await delay(1000);
      // turn on notification dialoag handler ( CLICK NOT NOW )
      await this.turnOffNotificationClick(page, cursor);
      await delay(100);
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
      const threadListSection = await page.$('[aria-label="Thread list"]');

      const boundingBox = await threadListSection!.boundingBox();
      console.log("boundingBox :", boundingBox);
      // let cursor = createCursor(page);
      // await page.mouse.move(
      //   boundingBox!.x + boundingBox!.width / 2,
      //   boundingBox!.y + boundingBox!.height / 2
      // );
      await cursor.moveTo({
        x: boundingBox!.x + boundingBox!.width / 2,
        y: boundingBox!.y + boundingBox!.height / 2,
      });

      let loadingDivSelector = '[aria-label="Loading..."]';

      let loadingDiv = await threadListSection?.$(loadingDivSelector);

      let limit = 2;
      let i = 0;
      let previoursObjectLeng = -99;
      let repeatedSameValue = 0;
      while (loadingDiv !== null && loadingDiv !== undefined) {
        loadingDiv = await page.$(loadingDivSelector);

        // get the chat user name , active status or last message time
        // let chatsDiv = await page.$('[aria-label="Chats"]');

        // let dmListDiv = await chatsDiv!.$(
        //   "div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x2lah0s.x193iq5w.xeuugli.xvbhtw8 > div > div.x78zum5.xdt5ytf.x1iyjqo2.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div:nth-child(2) > div"
        // );
        // let dmChildNodes = await dmListDiv?.$$(":scope > *");

        let keys = Object.keys(finaldata);
        console.log("scan links count :", keys.length);

        if (previoursObjectLeng === keys.length) {
          if (repeatedSameValue === 5) break;
          repeatedSameValue++;
        } else {
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
        await delay(randomdelay * 500);
        let randomScroll = Math.floor(Math.random() * 6) + 4;
        await page.mouse.wheel({ deltaY: randomScroll * 100 });
        // loadingDiv = await page.$('[aria-label="Loading..."]');

        i++;
      }
      console.log("end of while loop");

      return finaldata;
    } catch (error) {
      console.log("error in scan Dms :", error);
    }
    return finaldata;
  }

  async logIn({
    cookieLogin = true,
    index,
  }: {
    cookieLogin: boolean;
    index?: number;
  }): Promise<Page | undefined> {
    if (this.userId === "" && this.userId === undefined)
      throw "userid is not define";
    if (this.password === "" && this.password === undefined)
      throw "password is not define";
    try {
      let page = await this.browser!.newPage();
      await installMouseHelper(page);

      if (
        cookieLogin &&
        fs.existsSync(path.join(__dirname, `cookies-${index}.json`))
      ) {
        const cookies = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, `cookies-${index}.json`),
            "utf-8"
          )
        );
        await page.setCookie(...cookies);

        // Refresh the page or navigate to ensure cookies are applied
        await page.goto("https://www.instagram.com/", {
          waitUntil: "networkidle2",
        });
      } else {
        console.log(
          "No cookies file found. Please login first to save cookies.",
          this.userId,
          index
        );
        await page.goto("https://www.instagram.com/", {
          waitUntil: ["load", "networkidle0"],
          timeout: 900000,
        });
        let cursor = createCursor(page);

        await cursor.click('input[name="username"]');

        // login using password
        await page.type('input[name="username"]', this.userId, {
          delay: 100,
        });
        await delay(1000);
        await page.type('input[name="password"]', this.password, {
          delay: 100,
        });
        // await delay(500);
        cursor.click('button[type="submit"]');
        // await page.click('button[type="submit"]');
        await page.waitForNavigation({ timeout: 0 });

        console.log("Login successful!", this.userId, index);
        // await delay(1000);
        console.log("saving the cookies");

        // Save cookies to a file or database
        const cookies = await page.cookies();
        // if (setCookie) {
        //   setCookie(cookies);
        // }
        const cookieFilePath = path.join(
          __dirname,
          `cookies-${index ?? 0}.json`
        );
        try {
          fs.writeFileSync(cookieFilePath, JSON.stringify(cookies));
          console.log("Cookies saved!");
        } catch (error) {
          console.error("Error saving cookies:", error);
        }
        await this.saveInfoNotNow(page, cursor);
        await page.waitForSelector("section > main", { timeout: 0 });
        await delay(1000);
      }

      return page;
    } catch (error) {
      console.log("error in login the user", error);
      throw error;
    }
  }
  async dbSendDMAndFetchData({
    links,
    sendMessage = true,
  }: {
    links: string[];
    sendMessage?: boolean;
  }) {
    // send DMs

    let seenStatusSelector =
      "div.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xmz0i5r.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div > div > div:nth-child(3) > div > div:nth-child(2) > div > div > div > div.x78zum5.x13a6bvl.xvrgn94.x7ggn4r.xhepvqq > span";
    let msgListSelector =
      "div.x78zum5.x1r8uery.xdt5ytf.x1iyjqo2.xmz0i5r.x6ikm8r.x10wlt62.x1n2onr6 > div > div > div > div > div > div > div:nth-child(3) > div";

    let lastMsgDateSelector = "div.xjpr12u.xr9ek0c.x2b8uid > span > span";

    let userIdSelector =
      "div.x9f619.x1n2onr6.x1ja2u2z.x78zum5.xdt5ytf.x193iq5w.xeuugli.x1r8uery.x1iyjqo2.xs83m0k.xsyo7zv.x16hj40l.x10b6aqq.x1yrsyyn > a";
    let messageInputSelector =
      "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1i64zmx.xw3qccf.x1uhb9sk.x1plvlek.xryxfnj.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.xzsf02u.x1a2a7pz.x1n2onr6.x14wi4xw.x1iyjqo2.x1gh3ibb.xisnujt.xeuugli.x1odjw0f";
    let accountCategorySelector =
      "div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y.x8vgawa > section > main > div > header > section.xc3tme8.x1uhmqq1.x1xdureb.xo55r9g.x1vnunu7.x14tfgiu.xlrpkbc.xpoid6y.x16zxmhm.x6ikm8r.x10wlt62 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div";

    let chatActiveTimeSelector =
      "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1gslohp.x1uhb9sk.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > span";
    let hasSeenMsgSelector =
      "div > div.x78zum5.x13a6bvl.xvrgn94.x7ggn4r.xhepvqq > span";
    let hasRepliedSelector = "div > span > img";
    let userDetails: any[] = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];

      let scanData = await chatAccountModel.findOne(
        { dmLink: link },
        { scanData: 1 }
      );

      console.log(scanData);

      if (
        scanData !== null &&
        scanData.scanData !== undefined &&
        scanData.scanData["userId"] !== undefined
      ) {
        userDetails.push({ ...scanData.scanData });
        continue;
      }
      let page = await this.browser.newPage();
      try {
        // await blockResourceRequest(page);

        await page.goto(link, { waitUntil: ["load", "networkidle2"] });
        await this.turnOffNotificationClick(page);
        let cursor = createCursor(page);
        await page.waitForSelector(userIdSelector, { timeout: 5_000 });
        await delay(500);
        let profileUrl,
          userId,
          userName,
          accountCategory,
          country,
          seenStatus,
          lastMsgDate,
          hasReplied,
          hasSeenMsg,
          chatActiveTime;

        // dm will not be send if hasReplied, hasSeenMsg is true or chatActive was active

        try {
          await page.waitForSelector(msgListSelector, { timeout: 2_000 });
        } catch (error) {
          console.log("error in sendDmAndfetchData", error);
        }
        // console.log("message list loaded");

        try {
          let userIdElement = await page.$(userIdSelector);

          profileUrl =
            userIdElement !== null || userIdElement !== undefined
              ? await userIdElement?.evaluate((e: any) => e.href)
              : "";

          userId = profileUrl !== "" ? profileUrl.split("/")[3] : "";
          userName =
            userIdElement !== null || userIdElement !== undefined
              ? await userIdElement?.evaluate((e: any) => e.innerText)
              : "";

          let seenStatusElement = await page.$(seenStatusSelector);
          seenStatus =
            seenStatus !== null && seenStatus !== undefined
              ? await seenStatusElement?.evaluate((e: any) => e.innerText)
              : "";

          let msgListElement = await page.$(msgListSelector);
          if (msgListElement !== null && msgListElement !== undefined) {
            let msgList = (await msgListElement.$$(":scope > *")).reverse();
            let lastMsg = msgList[0];

            let hasSeenElement = await lastMsg.$(hasSeenMsgSelector);

            hasSeenMsg =
              hasSeenElement !== undefined
                ? await hasSeenElement?.evaluate((p: any) => p.innerText)
                : "";

            let hasRepliedElement = await lastMsg.$(hasRepliedSelector);
            hasReplied =
              hasRepliedElement !== undefined
                ? await hasRepliedElement?.evaluate((p: any) => p.innerText)
                : "";

            for (let msg of msgList) {
              let e = await msg.$(lastMsgDateSelector);
              if (e !== undefined && e !== null) {
                lastMsgDate = await e?.evaluate((p: any) => p.innerText);
                break;
              }
            }
          }

          let chatActiveElement = await page.$(chatActiveTimeSelector);

          chatActiveTime =
            chatActiveElement !== undefined
              ? await chatActiveElement?.evaluate((p: any) => p.innerText)
              : "";

          if (profileUrl !== undefined || profileUrl !== "") {
            await cursor.move(userIdSelector);

            let newPage = await this.browser.newPage();
            let newCursor = createCursor(newPage);
            await blockResourceRequest(newPage);
            await newPage.goto(profileUrl, { waitUntil: "networkidle2" });

            try {
              await newPage.waitForSelector(accountCategorySelector, {
                timeout: 2_000,
              });

              let accountCategoryElement = await newPage.$(
                accountCategorySelector
              );

              accountCategory =
                accountCategoryElement !== null
                  ? await accountCategoryElement.evaluate(
                      (e: any) => e.innerText
                    )
                  : "";
            } catch (error) {
              accountCategory = "";
            }
            let profileUserIdSelector =
              "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1h5jrl4.x1uhb9sk.x6ikm8r.x10wlt62.x1c4vz4f.xs83m0k.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > a > h2 > span";

            let userIdElement = await newPage.$(profileUserIdSelector);

            if (userIdElement !== null && userIdElement !== undefined) {
              await newCursor.click(profileUserIdSelector);
              try {
                let countrySelector =
                  "div:nth-child(2) > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > span:nth-child(2)";

                // await newPage.waitForSelector(countrySelector, {
                //   timeout: 2_0000,
                // });

                let countryElement = await newPage.$(countrySelector);
                let countryName = countryElement
                  ? await countryElement.evaluate((e: any) => e.innerText)
                  : "";

                country = countryName;
              } catch (error) {
                console.log(
                  "fail to find the account country element on profile page"
                );
              }
            }

            await newPage.close();
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

          // save data
          await chatAccountModel.updateOne(
            { dmLink: link },
            {
              $set: {
                scanData: d,
                userId,
                lastScanDate: Date.now(),
              },
            }
          );
          console.log("data Save");

          userDetails.push(d);

          console.log("details", d, userDetails.length);
        } catch (error) {
          console.log("urserid is not finc for this :", link);
          throw "not able to dm this user as it has been block";
        }

        // send message
        if (sendMessage)
          await this.sendDM(
            page,
            "Just following up on my previous message. Have you had a chance to review my previous message? It’s important to address the issue promptly to restore your profile's growth. \n #Hurryup ⌛",
            userId,
            cursor
          );

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
      } catch (error) {
        console.log("error :", error);
      } finally {
        await page.close();
      }
    }

    return userDetails;
  }
  async dblogIn({
    cookieLogin = true,
    cookie,
    setCookie,
    onFail,
  }: {
    cookieLogin: boolean;
    cookie?: any;
    setCookie?: any;
    onFail?: any;
  }): Promise<Page | undefined> {
    if (this.userId === "" && this.userId === undefined)
      throw "userid is not define";
    if (this.password === "" && this.password === undefined)
      throw "password is not define";
    try {
      let page = await this.browser!.newPage();
      await installMouseHelper(page);

      if (
        cookieLogin &&
        cookie
        // fs.existsSync(path.join(__dirname, `cookies-${index}.json`))
      ) {
        // const cookies = JSON.parse(
        //   fs.readFileSync(
        //     path.join(__dirname, `cookies-${index}.json`),
        //     "utf-8"
        //   )
        // );
        await page.setCookie(...cookie);

        // Refresh the page or navigate to ensure cookies are applied
        await page.goto("https://www.instagram.com/", {
          waitUntil: "networkidle2",
        });
      } else {
        console.log(
          "No cookies file found. Please login first to save cookies."
        );
        await page.goto("https://www.instagram.com/", {
          waitUntil: ["load", "networkidle0"],
          timeout: 900000,
        });
        let cursor = createCursor(page);

        await cursor.click('input[name="username"]');

        // login using password
        await page.type('input[name="username"]', this.userId, {
          delay: 100,
        });
        await delay(1000);
        await page.type('input[name="password"]', this.password, {
          delay: 100,
        });
        // await delay(500);
        cursor.click('button[type="submit"]');
        // await page.click('button[type="submit"]');

        await delay(2000);
        let url = page.url();
        if (url.includes("/challenge")) {
          throw "requied otp based authication" + this.userId;
        } else {
          await page.waitForNavigation({ timeout: 90000 });
        }

        console.log("Login successful!");
        // await delay(1000);
        console.log("saving the cookies");

        // Save cookies to a file or database
        const cookies = await page.cookies();
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
        } catch (error) {
          console.error("Error saving cookies:", error);
        }
        await this.saveInfoNotNow(page, cursor);
        await page.waitForSelector("section > main", { timeout: 90000 });
        await delay(1000);
      }

      return page;
    } catch (error) {
      console.log(`error in login for userID  : ${this.userId} \n `, error);
      if (onFail) onFail();
    }
  }

  async dispose() {
    if (this.browser === undefined) return;
    let pages = await this.browser.pages();
    if (pages.length !== 0) {
      let pagePromise = pages.map(async (page) => await page.close());

      await Promise.all([pagePromise]);
    }
    await this.browser.close();
  }
}

export default InstaService;
