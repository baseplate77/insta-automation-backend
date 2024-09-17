import express, { Request, Response } from "express";
import InstaService from "../services/insta_service";
import { accountModel } from "../db/schema/account.schema";
import { decrypt } from "../utils/encrypt";
import { chatAccountModel } from "../db/schema/chatAccount.schema";

const scanRouter = express.Router();

scanRouter.get("/scan-dm-db", async (req: Request, res: Response) => {
  res.send("started");
  //   66e92a56b2edd4862ce157a2
  const { accountId } = req.query;
  try {
    let account = await accountModel.findById(accountId);
    if (account === null) throw "no account with that id exists";

    let decryptPassword = decrypt(account.password!);
    let instaService = new InstaService();

    await instaService.init(account.userId!, decryptPassword);

    let page = await instaService.dblogIn({
      cookieLogin: true,
      cookie: account.isCookieValid ? account.cookie : undefined,
      setCookie: async (cookie: any) => {
        account.cookie = cookie;
        account.isCookieValid = true;
        await account.save();
      },
    });

    let data = await instaService.scanDMs(page!);
    await instaService.dispose();
    console.log("account :", account._id);

    let finalData = Object.keys(data).map((d) => ({
      updateOne: {
        filter: { dmLink: data[d]["link"] }, // Efficient query using indexed dmlink
        update: {
          $set: {
            dmLink: data[d]["link"],
            accountId: account._id,
          },
        }, // Update the document with new data
        upsert: true, // Insert if the document doesn't exist
        strict: false,
      },
    }));

    let d = await chatAccountModel.bulkWrite(finalData);
    // console.log("log :", d);
  } catch (error) {
    console.log("error :", error);
  }
});

scanRouter.get("/get-all-links", async (req: Request, res: Response) => {
  let { accountId } = req.query;

  let links = await chatAccountModel.find(
    { accountId: accountId },
    { dmLink: 1 }
  );

  res.send(links);
});

scanRouter.get("/full-scan-send-dm", async (req: Request, res: Response) => {
  let { accountId } = req.query;
  res.send("ok");
  try {
    let links = await chatAccountModel.find(
      { accountId: accountId },
      { dmLink: 1 }
    );

    let account = await accountModel.findOne({ _id: accountId });
    if (account === null) throw "no account exist with this id";
    if (links === null || links.length === 0) throw "unable to get the links";

    let instaService = new InstaService();
    await instaService.init(account.userId!, account.password!);
    let page = await instaService.dblogIn({
      cookieLogin: true,
      cookie: account.cookie !== undefined ? account.cookie : "",
      setCookie: async (cookie: any) => {
        account.cookie = cookie;
        account.isCookieValid = true;
        await account.save();
      },
    });

    let data: string[] = links.map((d) => d.dmLink!);
    let finalData = await instaService.dbSendDMAndFetchData({
      links: data,
      sendMessage: false,
    });
    console.log("final data :", finalData);

    await instaService.dispose();
  } catch (error) {
    console.log("error in full scan and send dm:", error);
  }
});

export default scanRouter;
