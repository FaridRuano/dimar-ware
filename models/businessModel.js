import mongoose, { Schema } from "mongoose"

const businesSchema = new Schema(
    {
        razonSocial: String,
        nombreComercial: String,
        ruc: String,
        direccion: String,
        llevaContabilidad: String,
        pwP12: String,
        establecimiento: String,
    },{
        timestamps: true
    }
)

const Business = mongoose.models.Business || mongoose.model('Business', businesSchema)

export default Business