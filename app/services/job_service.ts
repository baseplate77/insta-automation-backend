import { JobModel } from "../db/schema/job.schema";
import scanRouter from "../router/scan";
import {
  DETAILS_SCAN_TYPE,
  DM_SCAN_TYPE,
  SEND_MSG_TYPE,
} from "../utils/constants";

class JobService {
  async addJob({ type, state }: { type: string; state: any }) {
    let job = await JobModel.create({
      type,
      state,
      status: "pending",
      stopped_at: Date.now(),
    });

    return job;
  }

  async getAllJobs() {
    let jobs = await JobModel.find({});
    return jobs;
  }

  async startJob(id: String) {
    let job = await JobModel.findOne({ _id: id });

    if (job?.type === DM_SCAN_TYPE) {
      // resume the dm scan
    } else if (job?.type === DETAILS_SCAN_TYPE) {
      // resume Account detail scan
    } else if (job?.type === SEND_MSG_TYPE) {
      // resume send msg scan
    }
  }
}

export default JobService;
