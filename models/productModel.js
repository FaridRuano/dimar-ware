import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
    {
        cod: Number,
        name: String,
        und: String,
        cat: String,
        price: Number,
        stock: Number,
        user: String,
        status: Boolean,
        inventory: []
    },
    {
        timestamps: true
    }
)

const Product = mongoose.models.Product || mongoose.model('Product', productSchema)

export default Product