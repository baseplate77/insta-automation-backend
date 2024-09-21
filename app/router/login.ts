import express, { Request, Response } from "express";
import { accountModel } from "../db/schema/account.schema";
import InstaService from "../services/insta_service";
import { decrypt, encrypt } from "../utils/encrypt";

const loginRouter = express.Router();

loginRouter.post("/login-by-userid", async (req: Request, res: Response) => {
  let userIds = req.body as any;

  try {
    if (userIds === undefined) throw "no userid is define";
    const batchSize = 2;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const promises = batch.map(async (userId: string) => {
        let account = await accountModel.findOne({ userId: userId });
        if (account !== null) {
          let instaService = new InstaService();

          let decryptPassword = decrypt(account?.password!);

          console.log(account?.userId, decryptPassword);
          //   return;
          await instaService.init(account?.userId!, decryptPassword);

          await instaService.dblogIn({
            cookieLogin: true,
            cookie: undefined,
            setCookie: async (cookie: any) => {
              account.cookie = cookie;
              account.isCookieValid = true;
              await account?.save();
            },
            onFail: async () => {
              account.isCookieValid = false;
              account.cookie = undefined;
              await account.save();
            },
          });

          await instaService.dispose();
        }
        return account;
      });
      const accounts = await Promise.all(promises);
      console.log("accounts ", accounts);

      // Process accounts if needed
    }
    res.send("done");
  } catch (error) {
    console.log("error :", error);
    res.status(500).send({ error: error, success: false });
  }
});

loginRouter.get("/login-all-accounts", async (req: Request, res: Response) => {
  try {
    let page = 1; // or any page number you want
    const limit = 2; // fetch 1000 users per page

    const totalDocs = await accountModel.countDocuments({
      isCookieValid: false,
    });
    const totalPages = Math.ceil(totalDocs / limit);

    console.log(totalDocs, totalPages);

    while (totalPages >= page) {
      let skip = (page - 1) * limit;
      let accounts = await accountModel
        .find({ isCookieValid: false }, { userId: 1, password: 1 })
        .skip(skip)
        .limit(limit)
        .exec();
      //   console.log(accounts, page);
      page++;

      if (accounts !== null) {
        let promise = accounts.map(async (account) => {
          let instaService = new InstaService();

          let decryptPassword = decrypt(account.password!);

          console.log(account.userId, decryptPassword);
          //   return;
          await instaService.init(account.userId!, decryptPassword);

          await instaService.dblogIn({
            cookieLogin: true,
            cookie: undefined,
            setCookie: async (cookie: any) => {
              account.cookie = cookie;
              account.isCookieValid = true;
              await account.save();
            },
            onFail: async () => {
              account.isCookieValid = false;
              account.cookie = undefined;
              await account.save();
            },
          });

          await instaService.dispose();
        });

        await Promise.all([...promise]);
      }
    }

    console.log("all login complete");
  } catch (error: any) {
    console.log("error :", error);

    res.status(500).send({ success: false, error: error.toString() });
  }
});

export default loginRouter;
