import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import fs, { link } from "fs";
import path from "path";
import xlsx from "xlsx";
import InstaService from "./services/insta_service";
import {
  dmAccounts,
  dmFetchData,
  fetchAccounts,
  testAccounts,
} from "./utils/constants";
import { amdin } from "./utils/firebase";
import { sendMail } from "./utils/resend";
import DBService from "./db/db_service";
import { accountModel } from "./db/schema/account.schema";
import delay from "./utils/delay";
import { decrypt, encrypt } from "./utils/encrypt";
import mongoose from "mongoose";
import dbService from "./db/db_service";
import bodyParser from "body-parser";
import { chatAccountModel } from "./db/schema/chatAccount.schema";

// dbService.connect();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

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

app.get("/", async (req: Request, res: Response) => {
  let testKey = "hello you";

  let encrpyt = encrypt(testKey);
  console.log("emcrypt:", encrpyt);

  let decrpt = decrypt(encrpyt);

  console.log("decrpyt :", decrpt);

  res.send("ok");
});

app.post("/add-account", async (req: Request, res: Response) => {
  const { userId, password } = req.body;

  try {
    let encrpytPassword = encrypt(password);

    let account = await accountModel.create({
      userId,
      password: encrpytPassword,
      isCookieValid: false,
      cookie: {},
    });

    await account.save();
  } catch (error) {
    console.log("unable to add account to db : ", error);
  }

  res.send("ok");
});

app.get("/test-login", async (req: Request, res: Response) => {
  res.send("started");

  let promise = testAccounts.map(async (account: any, index) => {
    // const account = testAccounts[index];
    console.log("account :", account, index + 1);

    try {
      let instaService = new InstaService();
      await instaService.init(account.username, account.password);

      await delay(1000 * index);

      await instaService.logIn({ cookieLogin: true, index: index + 10 });

      await instaService.dispose();
    } catch (error) {
      console.log("failed to login :", account);
    }
  });
  await Promise.all([...promise]);
});

app.get("/test-scan-dm", async (req: Request, res: Response) => {
  res.send("started");

  try {
    let promise = testAccounts.map(async (dmAccount: any, index) => {
      try {
        var startTime = performance.now();

        console.log("account :", dmAccount);
        let instaServive = new InstaService();

        await instaServive.init(dmAccount.username, dmAccount.password);
        let page = await instaServive.logIn({
          cookieLogin: true,
          index: index + 10,
        });
        // note after login need to handle the save info click to not now
        console.log("login completeddd");
        // await delay(10000000);
        let finaldata = await instaServive.scanDMs(page);
        let details = Object.keys(finaldata).map((dmData) => finaldata[dmData]);

        let links = Object.keys(finaldata).map(
          (dmData) => finaldata[dmData]["link"]
        );
        console.log("links :", links);

        let data = await instaServive.sendDMAndFetchData(links.reverse());

        console.log("data :", data);

        await instaServive.dispose();

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(details);

        // Append the worksheet to the workbook
        xlsx.utils.book_append_sheet(wb, ws, "UserIDs");
        // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

        // Write the workbook to a file
        let filePath = path.join(__dirname, `${dmAccount.username}.xlsx`);
        xlsx.writeFile(wb, filePath);
        // console.log("links :", links.length);

        xlsx.writeFile(wb, filePath);
        const bucket = amdin.storage().bucket();
        await bucket.upload(filePath, {
          destination: `insta-data/${dmAccount.username}.xlsx`,
          metadata: {
            contentType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        });
        const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2500", // Set an appropriate expiration date
        });

        var endTime = performance.now();
        await sendMail(
          process.env.EMAIL!,
          `Insta-report-${dmAccount.username}`,
          `
            <div>
              DM scan for account ${dmAccount.username}
      
              time for execution - ${endTime - startTime} milliseconds
              <a href="${url}">${dmAccount.username}.xlsx</a>
            </div>
            `
        );
      } catch (error) {
        console.log("erorr  in test scana and send dm :", error);
      }
    });

    await Promise.all([...promise]);
  } catch (error) {
    console.log("error", error);
  }
});

// app.get("/login-all-account",async (req:Request,res:Response) => {

// })

app.get("/scan-dm-account", async (req: Request, res: Response) => {
  const { userId } = req.query;

  try {
    let account = await accountModel.findOne({ userId: userId });

    if (account === null) throw "no account with userid exits " + userId;

    let encrpytPassword = account.password;

    let password = decrypt(encrpytPassword ?? "");

    console.log("userId :", userId, password);
    let instaServer = new InstaService();

    await instaServer.init(account.userId!, password);
    let page = await instaServer.dblogIn({
      cookieLogin: true,
      cookie: account.cookie,
      setCookie: async (cookie: any) => {
        account.cookie = cookie;
        account.isCookieValid = true;
        await account.save();
      },
    });

    let data = await instaServer.scanDMs(page);

    let dmData = Object.keys(data).map((d) => ({
      ...data[d],
      accountId: account._id,
    }));

    await chatAccountModel.insertMany(dmData);
  } catch (error) {
    console.log("error :", error);
    res.status(500).send(error);
  }

  res.send("ok");
});

app.get("/scan-dm", async (req: Request, res: Response) => {
  const { accNumber } = req.query;
  let index = parseInt(accNumber as string);
  res.send("started");

  // // get dm links

  // for (let index = 0; index < dmAccounts.length; index++) {
  var startTime = performance.now();

  const dmAccount = dmAccounts[index];
  console.log("account :", dmAccount);
  let instaServive = new InstaService();

  await instaServive.init(dmAccount.username, dmAccount.password);
  let page = await instaServive.logIn({ cookieLogin: true, index: index });
  // note after login need to handle the save info click to not now
  console.log("login completeddd");
  // await delay(10000000);
  let finaldata = await instaServive.scanDMs(page);
  let details = Object.keys(finaldata).map((dmData) => finaldata[dmData]);

  let links = Object.keys(finaldata).map((dmData) => finaldata[dmData]["link"]);
  console.log("links :", links);

  let data = await instaServive.sendDMAndFetchData(links.reverse());

  console.log("data :", data);

  await instaServive.dispose();

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(details);

  // Append the worksheet to the workbook
  xlsx.utils.book_append_sheet(wb, ws, "UserIDs");
  // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  // Write the workbook to a file
  let filePath = path.join(__dirname, `${dmAccount.username}.xlsx`);
  xlsx.writeFile(wb, filePath);
  // console.log("links :", links.length);

  xlsx.writeFile(wb, filePath);
  const bucket = amdin.storage().bucket();
  await bucket.upload(filePath, {
    destination: `insta-data/${dmAccount.username}.xlsx`,
    metadata: {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
  const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2500", // Set an appropriate expiration date
  });

  var endTime = performance.now();
  await sendMail(
    process.env.EMAIL!,
    `Insta-report-${dmAccount.username}`,
    `
      <div>
        DM scan for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}.xlsx</a>
      </div>
      `
  );
  // }
});

app.get("/send-msg", async (req: Request, res: Response) => {
  let { accNumber } = req.query;
  let index = parseInt((accNumber as string) ?? "0");
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
    let dmAccount = fetchAccounts[index];

    console.log("account :", dmAccount);

    let instaServive = new InstaService();

    await instaServive.init(dmAccount.username, dmAccount.password);
    let page = await instaServive.logIn({
      cookieLogin: true,
      index: index + 10,
    });

    let startTime = performance.now();
    let data = await instaServive.sendDMAndFetchData(links);

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);

    // Append the worksheet to the workbook
    xlsx.utils.book_append_sheet(wb, ws, "UserIDs");

    // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    // Write the workbook to a file

    let filePath = path.join(__dirname, `${dmAccount.username}-dm-detail.xlsx`);
    xlsx.writeFile(wb, filePath);
    const bucket = amdin.storage().bucket();
    await bucket.upload(filePath, {
      destination: `insta-data/${dmAccount.username}.xlsx`,
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
    const file = bucket.file(`insta-data/${dmAccount.username}-dm-detail.xlsx`);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    var endTime = performance.now();

    await sendMail(
      process.env.EMAIL!,
      `Insta-DM-report-${dmAccount.username}`,
      `
      <div>
        DM Detail data for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}-dm-details.xlsx</a>
      </div>
      `
    );

    console.log("completed");
  } catch (error) {
    console.log("error in send the message");
  }
});

app.get("/test", async (req: Request, res: Response) => {
  // test on 10 acounts
  const { accNumber } = req.query;
  let index = parseInt(accNumber as string);

  res.send("started");

  // get dm links
  // for (let index = 0; index < 1; index++) {
  var startTime = performance.now();
  const dmAccount = dmAccounts[index];
  console.log("account :", dmAccount);
  let instaServive = new InstaService();

  await instaServive.init(dmAccount.username, dmAccount.password);
  let page = await instaServive.logIn({ cookieLogin: true, index });
  // note after login need to handle the save info click to not now
  console.log("login completeddd");

  let finaldata = await instaServive.scanDMs(page);

  let links = Object.keys(finaldata).map((dmData) => ({
    link: "https://www.instagram.com" + dmData,
    ...finaldata[dmData],
  }));
  await instaServive.dispose();
  console.log("finalData :", links);

  // console.log("links :", links.length);

  fs.writeFileSync(
    path.join(__dirname, `finalData-${index}.json`),
    JSON.stringify(links)
  );
  // console.log("final data :", finaldata);

  // scan the ids
  let linksPerAccount = 2;
  let noOfAccount = 20;
  let userIds: any[] = [];
  for (let i = 0; i < links.length; i += linksPerAccount) {
    let accountLinks = links.splice(i, linksPerAccount);
    console.log("account Link :", accountLinks);

    instaServive = new InstaService();

    let accountNo = (i / linksPerAccount) % noOfAccount;
    let fetchAccount = fetchAccounts[accountNo];
    console.log("fetch account :", fetchAccount, accountNo);

    await instaServive.init(fetchAccount.username, fetchAccount.password);

    await instaServive.logIn({ cookieLogin: true, index: index });

    let tempId = await instaServive.fetchUserIdFromDmLinks(accountLinks);
    userIds.push(...tempId);
    await instaServive.dispose();
  }

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(userIds);

  // Append the worksheet to the workbook
  xlsx.utils.book_append_sheet(wb, ws, "UserIDs");

  // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  // Write the workbook to a file

  let filePath = path.join(__dirname, `${dmAccount.username}.xlsx`);
  xlsx.writeFile(wb, filePath);
  const bucket = amdin.storage().bucket();
  await bucket.upload(filePath, {
    destination: `insta-data/${dmAccount.username}.xlsx`,
    metadata: {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
  const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2500",
  });

  var endTime = performance.now();

  await sendMail(
    process.env.EMAIL!,
    `Insta-report-${dmAccount.username}`,
    `
      <div>
        Fetch data for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}.xlsx</a>
      </div>
      `
  );

  console.log("completed");

  // fs.writeFileSync(
  //   path.join(__dirname, `userids-${index}.json`),
  //   JSON.stringify(userids)
  // );

  console.log(`Call to doSomething took ${endTime - startTime} milliseconds`);
  // }
});
app.get("/test2", async (req: Request, res: Response) => {
  // test on 10 acounts

  res.send("started");

  // get dm links
  for (let index = 5; index < dmAccounts.length; index++) {
    var startTime = performance.now();
    const dmAccount = dmAccounts[index];
    console.log("account :", dmAccount);
    let instaServive = new InstaService();

    await instaServive.init(dmAccount.username, dmAccount.password);
    let page = await instaServive.logIn({ cookieLogin: true, index });
    // note after login need to handle the save info click to not now
    console.log("login completeddd");

    let finaldata = await instaServive.scanDMs(page);
    let links = Object.keys(finaldata).map(
      (dmData) => "https://www.instagram.com" + dmData
    );
    await instaServive.dispose();
    // console.log("links :", links.length);

    fs.writeFileSync(
      path.join(__dirname, `finalData-${index}.json`),
      JSON.stringify(links)
    );
    // console.log("final data :", finaldata);

    // scan the ids

    instaServive = new InstaService();
    let fetchAccount = fetchAccounts[index];
    await instaServive.init(fetchAccount.username, fetchAccount.password);
    await instaServive.logIn({ cookieLogin: true, index: index + 100 });
    let userids = await instaServive.fetchUserIdFromDmLinks(
      links.slice(0, 100)
    );
    await instaServive.dispose();

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(userids);

    // Append the worksheet to the workbook
    xlsx.utils.book_append_sheet(wb, ws, "UserIDs");
    // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // Write the workbook to a file
    let filePath = path.join(__dirname, `${dmAccount.username}.xlsx`);
    xlsx.writeFile(wb, filePath);
    const bucket = amdin.storage().bucket();
    await bucket.upload(filePath, {
      destination: `insta-data/${dmAccount.username}.xlsx`,
      metadata: {
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
    const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500", // Set an appropriate expiration date
    });

    var endTime = performance.now();
    await sendMail(
      process.env.EMAIL!,
      `Insta-report-${dmAccount.username}`,
      `
      <div>
        Fetch data for account ${dmAccount.username}

        time for execution - ${endTime - startTime} milliseconds
        <a href="${url}">${dmAccount.username}.xlsx</a>
      </div>
      `
    );

    console.log("completed");

    // fs.writeFileSync(
    //   path.join(__dirname, `userids-${index}.json`),
    //   JSON.stringify(userids)
    // );
    console.log(`Call to doSomething took ${endTime - startTime} milliseconds`);
  }
});
app.get("/insta-login", async (req: Request, res: Response) => {
  let finaldata: any = {};

  try {
    //   // await page.goto("https://www.instagram.com/", {
    //   //   waitUntil: ["load", "networkidle0"],
    //   // });
    //   console.log("page loaded ");

    let instaServive = new InstaService();
    let fetchAccount = fetchAccounts[0];
    await instaServive.init(fetchAccount.username!, fetchAccount.password!);
    //   try {
    let page = await instaServive.logIn({ cookieLogin: true });

    //     finaldata = await instaServive.scanDMs(page);

    let links = Object.keys(dmFetchData).map(
      (dmData) => "https://www.instagram.com" + dmData
    );
    let userIds = await instaServive.fetchUserIdFromDmLinks(links);
    //   } catch (error) {
    //     console.log("error :", error);
    //   }

    // -------
    // setp 2
    // open the chat link and save the user Id

    console.log("hi there ");

    res.send({ userIds });
  } catch (error) {
    console.log("fail to finish :", error);
    // add retry logic
  }
  console.log("at the end");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
