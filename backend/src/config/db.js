import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to backend/.env.');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB connected (${mongoose.connection.name}).`);
  } catch (error) {
    throw new Error(`Could not connect to MongoDB: ${error.message}`, { cause: error });
  }
}
