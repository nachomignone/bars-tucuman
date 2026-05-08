import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB conectado exitosamente');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
