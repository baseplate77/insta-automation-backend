import express, { Request, Response } from "express";
import { accountModel } from "../db/schema/account.schema";
import InstaService from "../services/insta_service";
import { decrypt, encrypt } from "../utils/encrypt";

const loginRouter = express.Router();

loginRouter.post("/add-account", async (req: Request, res: Response) => {
  const accounts: any[] = req.body as any[];

  try {
    if (accounts === undefined) throw "no details where provided";
    for (let { userId, password } of accounts) {
      let encrpytPassword = encrypt(password);
      console.log(userId, password);

      let a = await accountModel.findOne({ userId: userId });
      console.log("account :", a);
      if (a !== null) {
        console.log(a.userId, "account already exist");
        continue;
      }
      let account = await accountModel.create({
        userId,
        password: encrpytPassword,
        isCookieValid: false,
        cookie: {},
      });

      await account.save();
    }
    res.send({ success: true, addAccountNo: accounts.length });
  } catch (error) {
    console.log("unable to add account to db : ", error);
    res.status(500).send({ error: error, success: false });
  }
});

loginRouter.get("/get-accounts", async (req: Request, res: Response) => {
  try {
    let accounts = await accountModel.find({}, { password: 1, userId: 1 });

    let ac = accounts.map((a) => {
      let decrpytPassword = decrypt(a.password!);
      return {
        userId: a.userId,
        password: decrpytPassword,
      };
    });

    res.send(ac);
  } catch (error: any) {
    console.log("error ", error);
    res.status(500).send({ success: false, error: error.toString() });
  }
});

loginRouter.post("/update-password", async (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;

  try {
    let account = await accountModel.findOne(
      { userId: userId },
      { password: 1 }
    );

    if (account === null) return "no entry with this userId was found";
    if (newPassword === "" || newPassword === undefined)
      throw "new password was empty";
    const encrpytPassword = encrypt(newPassword);

    account.password = encrpytPassword;
    await account.save();
    console.log("password updated");

    res.send({ success: true });
  } catch (error: any) {
    console.log("error in updating password :", userId, error);

    res.status(500).send({ success: false, error: error.toString() });
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
          });

          await instaService.dispose();
        });

        await Promise.all([...promise]);
      }
    }
  } catch (error: any) {
    console.log("error :", error);

    res.status(500).send({ success: false, error: error.toString() });
  }
});

export default loginRouter;
