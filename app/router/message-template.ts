import express, { Request, Response } from "express";
import { MessageTemplateModel } from "../db/schema/message-template.schema";

const messageTemplateRouter = express.Router();

messageTemplateRouter.post(
  "/message-template",
  async (req: Request, res: Response) => {
    let { name, message, attachment, type } = req.body;

    try {
      if (name === undefined || message === undefined || type === undefined)
        throw "name , message or type where not define";

      let messageTemplate = await MessageTemplateModel.create({
        name,
        message,
        type,
        attachment,
      });

      await messageTemplate.save();

      res.send({ success: true });
    } catch (error: any) {
      console.log("error in saving message template", error);
      res.status(500).send({ success: false, error: error.toString() });
    }
  }
);

messageTemplateRouter.get(
  "/message-template",
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const skip = (page - 1) * limit;
      let totalDocs = await MessageTemplateModel.countDocuments({});
      let totalPages = Math.ceil(totalDocs / limit);

      let messageTemplate = await MessageTemplateModel.find({})
        .skip(skip)
        .limit(limit);

      res.send({
        success: true,
        totalDocs,
        totalPages,
        page,
        limit,
        messageTemplate,
      });
    } catch (error: any) {
      console.log("error in getting the message template", error);
      res.status(500).send({ success: false, error: error.toString() });
    }
  }
);

export default messageTemplateRouter;
