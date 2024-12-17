import mongoose, { Schema } from "mongoose";

const cliDataSchema = new Schema(
    {
        type: String,
        dni: String,
        name: String,
        email: String,
        address: String,
        phone: String,
    }
)

const saleSchema = new Schema(
    {
        cod: Number,
        saler: String,
        biller: String,
        client: String,
        subtotal: Number,
        secuencial: Number,
        iva: Number,
        total: Number,
        status: String,
        paymentMethod: String,
        cart: [],
        billData: cliDataSchema,
        notes: String,
        ptoEmi: String,
        codDoc: String,        
    },{
        timestamps: true
    }
)

const Sale = mongoose.models.Sale || mongoose.model('Sale', saleSchema)

export default Sale