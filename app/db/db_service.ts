import mongoose, { Schema, Document, Model } from "mongoose";

interface Item extends Document {
  // Define the schema for your item here
  name: string;
  value: number;
}

const itemSchema = new Schema<Item>({
  name: { type: String, required: true },
  value: { type: Number, required: true },
});

class DBService {
  private itemModel: Model<Item>;

  constructor() {
    this.itemModel = mongoose.model<Item>("Item", itemSchema);
  }

  async connect() {
    await mongoose.connect(process.env.DB_URI!, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB with Mongoose");
  }

  async addItem(item: Partial<Item>) {
    const newItem = new this.itemModel(item);
    const result = await newItem.save();
    return result._id;
  }

  //   async deleteItem(query: Partial<Item>) {
  //     const result = await this.itemModel.deleteOne(query);
  //     return result.deletedCount;
  //   }

  async close() {
    await mongoose.connection.close();
    console.log("Connection to MongoDB closed");
  }
}
const dbService = new DBService();

export default dbService;
