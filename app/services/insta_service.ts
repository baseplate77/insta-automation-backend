import { Browser, Page } from "puppeteer";
import { globalBrowser } from "../utils/browerSetup";
import { installMouseHelper } from "../utils/mouse-helper";
import { createCursor, GhostCursor } from "ghost-cursor";
import delay from "../utils/delay";

import fs from "fs";
import path from "path";

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
  async fetchUserIdFromDmLinks(links: string[], batchSize = 2) {
    // let batchSize = 2;
    let profileData: any = [];

    for (let i = 0; i < links.length; i += batchSize) {
      let tempLinks = [...links];
      let batchLinks = tempLinks.splice(i, batchSize);
      console.log("batch Links :", batchLinks);
      console.log("current index :", i * batchSize);

      let promises = batchLinks.map(async (link) => {
        let newPage = await this.browser.newPage();
        try {
          let data: any = {};
          await newPage.goto(link, { waitUntil: "networkidle2" });
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
              data["dmLink"] = link;
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
  async scanDMs(page?: Page) {
    let finaldata: any = [];
    try {
      if (page === undefined) throw "now auth page was provided";
      if (this.browser === undefined) throw "browser not define";

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
          //   console.log("header : ", request.postData());

          if (
            jsonObject["payload"] !== undefined &&
            jsonObject["payload"]["payloads"] !== undefined &&
            /\d/.test(Object.keys(jsonObject["payload"]["payloads"])[0])
          ) {
            let inboxUrls = Object.keys(jsonObject["payload"]["payloads"]);

            for (let index = 0; index < inboxUrls.length; index++) {
              const inboxUrl = inboxUrls[index] as any;
              if (finaldata[inboxUrl] === undefined) {
                finaldata[inboxUrl] = {};
              }
            }
            let filePath = path.join(__dirname, "inbox.txt");
            let inboxLinks = Object.keys(finaldata).map(
              (d) => "https://www.instagram.com" + d
            );

            fs.writeFileSync(filePath, inboxLinks.join("\n"));
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

      await delay(2000);
      // await delay(2000);
      // if login challenge is present select "not now"
      let url = page.url();
      // console.log("url :", url);
      let cursor = createCursor(page);

      if (url.includes("challenge/")) {
        await page.waitForSelector("form > div > div:nth-child(2)");
        let thatWasMeBtn = await page.$("form > div > div:nth-child(2)");
        if (thatWasMeBtn) {
          await cursor.click("form > div > div:nth-child(2)");
          // await thatWasMeBtn?.click();
        }

        // await page.content();
      }

      await page.waitForSelector('[aria-label="Thread list"]');

      // await delay(2000);
      // turn on notification dialoag handler ( CLICK NOT NOW )
      await this.turnOffNotificationClick(page, cursor);
      await delay(2000);
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
      let loadingDiv = await page.$('[aria-label="Loading..."]');

      let limit = 5;
      let i = 0;
      console.log("limit :", limit);

      while (loadingDiv !== null && loadingDiv !== undefined && limit > i) {
        loadingDiv = await page.$('[aria-label="Loading..."]');
        // get the chat user name , active status or last message time
        let chatsDiv = await page.$('[aria-label="Chats"]');

        let dmListDiv = await chatsDiv!.$(
          "div > div > div > div > div > div:nth-child(2) > div"
        );
        let dmChildNodes = await dmListDiv?.$$(":scope > *");

        let keys = Object.keys(finaldata);
        console.log("object keys length :", keys.length, dmChildNodes?.length);

        for (let index = 0; index < dmChildNodes!.length; index++) {
          // data already exist return
          if (
            finaldata[keys[index]] !== undefined &&
            finaldata[keys[index]]["userName"] === undefined &&
            keys.length > index
          ) {
            try {
              const element = dmChildNodes![index];

              await element.scrollIntoView();

              await delay(300);
              let userNameSelector =
                "span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.xo1l8bm.x5n08af.x1tu3fi.x3x7a5m.x10wh9bi.x1wdrske.x8viiok.x18hxmgj > span";
              element.waitForSelector(userNameSelector, { timeout: 2_000 });
              let userName = await element.$eval(
                userNameSelector,
                (e: any) => e.innerText
              );

              let lastActiveElement = await element.$(
                "div > div:nth-child(3) > div > span > span"
              );
              let lastActive = lastActiveElement
                ? await lastActiveElement.evaluate((e) => e.innerText)
                : "";

              lastActive = lastActive.toLocaleLowerCase().includes("active")
                ? lastActive.split("\n")[1]
                : "";
              let lastMsgDateElement = await element.$(
                "div > div:nth-child(3) > div > div > span > span > div > span"
              );
              let lastMsgDate = lastMsgDateElement
                ? await lastMsgDateElement.evaluate((e) => e.innerText)
                : "";

              finaldata[keys[index]] = {
                userName,
                lastActive,
                lastMsgDate,
              };
              console.log("found data of ", index, keys[index]);

              // console.log(
              //   index,
              //   "data :",
              //   userName,
              //   "\n",
              //   lastActive,
              //   "\n",
              //   lastMsgDate
              // );
            } catch (error) {
              finaldata[keys[index]] = {
                userName: "",
                lastActive: "",
                lastMsgDate: "",
              };
              console.log(
                "error :",
                index,
                keys.length > index ? keys[index] : "index is higher than key",
                "\n",
                error
              );
            }
          }
        }

        // scroll to fetch new dm
        let randomdelay = Math.random() * 3 + 1;
        await delay(randomdelay * 1000);
        let randomScroll = Math.floor(Math.random() * 6) + 4;
        await page.mouse.wheel({ deltaY: randomScroll * 100 });
        // loadingDiv = await page.$('[aria-label="Loading..."]');

        i++;
      }

      console.log("end of while loop");

      return finaldata;
    } catch (error) {
      console.log("error in scan Dms :", error);
      throw error;
    }
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
          "No cookies file found. Please login first to save cookies."
        );
        await page.goto("https://www.instagram.com/", {
          waitUntil: ["load", "networkidle0"],
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

        console.log("Login successful!");
        // await delay(1000);
        console.log("saving the cookies");

        // Save cookies to a file or database
        const cookies = await page.cookies();
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
        await page.waitForSelector("section > main");
        await delay(1000);
      }

      return page;
    } catch (error) {
      console.log("error in login the user", error);
      throw error;
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
