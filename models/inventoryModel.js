import mongoose, { Schema } from "mongoose";

const inventorySchema = new Schema(
    {
        cod: Number,
        name: String,
        user: String,
        reason: String,
        method: String,
        amount: Number,
        newStock: Number,
    },
    {
        timestamps: true
    }
)

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema)

export default Inventory