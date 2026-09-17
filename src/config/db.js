import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || (
      process.env.DB_USER && process.env.DB_PASS
        ? `mongodb+srv://${encodeURIComponent(process.env.DB_USER)}:${encodeURIComponent(process.env.DB_PASS)}@cluster0.9vgajnj.mongodb.net/eTutionBd?retryWrites=true&w=majority&appName=Cluster0`
        : 'mongodb://127.0.0.1:27017/etuitionbd'
    );
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit process in dev if DB connection fails, but log clearly
  }
};
