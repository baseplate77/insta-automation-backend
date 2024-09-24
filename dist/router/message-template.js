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
const message_template_schema_1 = require("../db/schema/message-template.schema");
const messageTemplateRouter = express_1.default.Router();
messageTemplateRouter.post("/message-template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { name, message, attachment, type } = req.body;
    try {
        if (name === undefined || message === undefined || type === undefined)
            throw "name , message or type where not define";
        let messageTemplate = yield message_template_schema_1.MessageTemplateModel.create({
            name,
            message,
            type,
            attachment,
        });
        yield messageTemplate.save();
        res.send({ success: true });
    }
    catch (error) {
        console.log("error in saving message template", error);
        res.status(500).send({ success: false, error: error.toString() });
    }
}));
messageTemplateRouter.get("/message-template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;
        let totalDocs = yield message_template_schema_1.MessageTemplateModel.countDocuments({});
        let totalPages = Math.ceil(totalDocs / limit);
        let messageTemplate = yield message_template_schema_1.MessageTemplateModel.find({})
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
    }
    catch (error) {
        console.log("error in getting the message template", error);
        res.status(500).send({ success: false, error: error.toString() });
    }
}));
exports.default = messageTemplateRouter;
