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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const job_schema_1 = require("../db/schema/job.schema");
let jobRouter = express_1.default.Router();
jobRouter.get("/get-all-jobs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let jobs = yield job_schema_1.JobModel.find({});
        res.send({ success: true, jobs });
    }
    catch (error) {
        console.log("error in getting all jobs :", error);
        res.status(500).send({ success: false, error: error.toString() });
    }
}));
exports.default = jobRouter;
