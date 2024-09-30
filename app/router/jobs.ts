import express, { Request, Response } from "express";
import { JobModel } from "../db/schema/job.schema";

let jobRouter = express.Router();

jobRouter.get("/get-all-jobs", async (req: Request, res: Response) => {
  try {
    let jobs = await JobModel.find({});

    res.send({ success: true, jobs });
  } catch (error: any) {
    console.log("error in getting all jobs :", error);
    res.status(500).send({ success: false, error: error.toString() });
  }
});

export default jobRouter;
