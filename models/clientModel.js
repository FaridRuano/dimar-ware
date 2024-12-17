import mongoose, { Schema } from "mongoose";

const clientSchema = new Schema(
    {
        type: String,
        dni: String,
        name: String,
        email: String,
        address: String,
        phone: String,
        user: String,
    },
    {
        timestamps: true
    }
)

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema)

export default Client