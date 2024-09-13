import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";
import InstaService from "./services/insta_service";
import { dmAccounts, dmFetchData, fetchAccounts } from "./utils/constants";
import { amdin } from "./utils/firebase";
import { sendMail } from "./utils/resend";
import DBService from "./db/db_service";
import { accountModel } from "./db/schema/account.schema";
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

const dbTest = async () => {
  const dbService = new DBService();
  dbService.connect();

  const cookies = JSON.parse(
    fs.readFileSync(path.join(__dirname, `cookies-${0}.json`), "utf-8")
  );

  // console.log("cookie :", cookies);

  let account = await accountModel.create({
    usename: "nj",
  });
  let a = await account.save();
  console.log("a ;", a);
};

// dbTest();
app.get("/", async (req: Request, res: Response) => {
  res.send("ok");
});

app.get("/scan-dm", async (req: Request, res: Response) => {
  res.send("started");

  // let promise = dmAccounts.map(async (d: any, index: number) => {
  //   var startTime = performance.now();
  //   const dmAccount = dmAccounts[index];
  //   await delay(index * 1000);
  //   console.log("account :", dmAccount);
  //   let instaServive = new InstaService();

  //   await instaServive.init(dmAccount.username, dmAccount.password);
  //   let page = await instaServive.logIn({ cookieLogin: true, index });
  //   // note after login need to handle the save info click to not now
  //   console.log("login completeddd");
  //   let finaldata = await instaServive.scanDMs(page);
  //   let details = Object.keys(finaldata).map((dmData) => finaldata[dmData]);
  //   await instaServive.dispose();
  //   console.log("final data :", finaldata);

  //   const wb = xlsx.utils.book_new();
  //   const ws = xlsx.utils.json_to_sheet(details);

  //   // Append the worksheet to the workbook
  //   xlsx.utils.book_append_sheet(wb, ws, "UserIDs");
  //   // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

  //   // Write the workbook to a file
  //   let filePath = path.join(__dirname, `${dmAccount.username}.xlsx`);
  //   xlsx.writeFile(wb, filePath);
  //   // console.log("links :", links.length);

  //   xlsx.writeFile(wb, filePath);
  //   const bucket = amdin.storage().bucket();
  //   await bucket.upload(filePath, {
  //     destination: `insta-data/${dmAccount.username}.xlsx`,
  //     metadata: {
  //       contentType:
  //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //     },
  //   });
  //   const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
  //   const [url] = await file.getSignedUrl({
  //     action: "read",
  //     expires: "03-01-2500", // Set an appropriate expiration date
  //   });

  //   var endTime = performance.now();
  //   await sendMail(
  //     process.env.EMAIL!,
  //     `Insta-report-${dmAccount.username}`,
  //     `
  //     <div>
  //       DM scan for account ${dmAccount.username}

  //       time for execution - ${endTime - startTime} milliseconds
  //       <a href="${url}">${dmAccount.username}.xlsx</a>
  //     </div>
  //     `
  //   );
  // });

  // await Promise.all(promise);

  // // get dm links

  for (let index = 0; index < dmAccounts.length; index++) {
    var startTime = performance.now();
    const dmAccount = dmAccounts[index];
    console.log("account :", dmAccount);
    let instaServive = new InstaService();

    await instaServive.init(dmAccount.username, dmAccount.password);
    let page = await instaServive.logIn({ cookieLogin: true, index });
    // note after login need to handle the save info click to not now
    console.log("login completeddd");

    let finaldata = await instaServive.scanDMs(page);
    let details = Object.keys(finaldata).map((dmData) => finaldata[dmData]);
    await instaServive.dispose();
    console.log("final data :", finaldata);

    // const wb = xlsx.utils.book_new();
    // const ws = xlsx.utils.json_to_sheet(details);

    // // Append the worksheet to the workbook
    // xlsx.utils.book_append_sheet(wb, ws, "UserIDs");
    // // const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    // // Write the workbook to a file
    // let filePath = path.join(__dirname, `${dmAccount.username}.xlsx`);
    // xlsx.writeFile(wb, filePath);
    // // console.log("links :", links.length);

    // xlsx.writeFile(wb, filePath);
    // const bucket = amdin.storage().bucket();
    // await bucket.upload(filePath, {
    //   destination: `insta-data/${dmAccount.username}.xlsx`,
    //   metadata: {
    //     contentType:
    //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //   },
    // });
    // const file = bucket.file(`insta-data/${dmAccount.username}.xlsx`);
    // const [url] = await file.getSignedUrl({
    //   action: "read",
    //   expires: "03-01-2500", // Set an appropriate expiration date
    // });

    var endTime = performance.now();
    // await sendMail(
    //   process.env.EMAIL!,
    //   `Insta-report-${dmAccount.username}`,
    //   `
    //   <div>
    //     DM scan for account ${dmAccount.username}

    //     time for execution - ${endTime - startTime} milliseconds
    //     <a href="${url}">${dmAccount.username}.xlsx</a>
    //   </div>
    //   `
    // );
  }
});
app.get("/test", async (req: Request, res: Response) => {
  // test on 10 acounts

  res.send("started");

  // get dm links
  for (let index = 0; index < 1; index++) {
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

    await instaServive.logIn({ cookieLogin: true, index: index });

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
  }
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
