import mongoose from 'mongoose';

const connectMongoDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    return mongoose.connect(process.env.NEXT_MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
}

export default connectMongoDB;
