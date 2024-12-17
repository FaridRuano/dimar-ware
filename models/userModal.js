import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        name: String,
        email: String,
        password: String,
        rol: String,
        status: Boolean
    },
    {
        timestamps: true
    }
)

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;

