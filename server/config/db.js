import mongoose from 'mongoose';

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Exits the process if the connection fails.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
