"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_schema_1 = require("../db/schema/job.schema");
const constants_1 = require("../utils/constants");
class JobService {
    addJob(_a) {
        return __awaiter(this, arguments, void 0, function* ({ type, state }) {
            let job = yield job_schema_1.JobModel.create({
                type,
                state,
                status: "pending",
                stopped_at: Date.now(),
            });
            return job;
        });
    }
    getAllJobs() {
        return __awaiter(this, void 0, void 0, function* () {
            let jobs = yield job_schema_1.JobModel.find({});
            return jobs;
        });
    }
    startJob(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let job = yield job_schema_1.JobModel.findOne({ _id: id });
            if ((job === null || job === void 0 ? void 0 : job.type) === constants_1.DM_SCAN_TYPE) {
                // resume the dm scan
            }
            else if ((job === null || job === void 0 ? void 0 : job.type) === constants_1.DETAILS_SCAN_TYPE) {
                // resume Account detail scan
            }
            else if ((job === null || job === void 0 ? void 0 : job.type) === constants_1.SEND_MSG_TYPE) {
                // resume send msg scan
            }
        });
    }
}
exports.default = JobService;
