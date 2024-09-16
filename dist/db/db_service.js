"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const mongoose_1 = __importStar(require("mongoose"));
const itemSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true },
});
class DBService {
    constructor() {
        this.itemModel = mongoose_1.default.model("Item", itemSchema);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield mongoose_1.default.connect(process.env.DB_URI, {
            //   useNewUrlParser: true,
            //   useUnifiedTopology: true,
            });
            console.log("Connected to MongoDB with Mongoose");
        });
    }
    addItem(item) {
        return __awaiter(this, void 0, void 0, function* () {
            const newItem = new this.itemModel(item);
            const result = yield newItem.save();
            return result._id;
        });
    }
    //   async deleteItem(query: Partial<Item>) {
    //     const result = await this.itemModel.deleteOne(query);
    //     return result.deletedCount;
    //   }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield mongoose_1.default.connection.close();
            console.log("Connection to MongoDB closed");
        });
    }
}
const dbService = new DBService();
exports.default = dbService;
