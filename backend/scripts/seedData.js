import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bar from '../models/Bar.js';
import connectDB from '../config/database.js';
import mockBares from '../data/mockBares.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await connectDB();

    console.log('🧹 Limpiando bares existentes...');
    await Bar.deleteMany({});

    console.log('📥 Insertando datos mock...');
    const resultado = await Bar.insertMany(mockBares);

    console.log('\n✅ Base de datos poblada exitosamente');
    console.log(`📊 Se insertaron ${resultado.length} bares`);
    console.log('\nBares insertados:');
    resultado.forEach((bar, idx) => {
      console.log(`${idx + 1}. ${bar.nombre} - ${bar.ubicacion}`);
    });

    console.log('\n🚀 Próximo paso: ejecuta "npm run dev" para iniciar el servidor\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error poblando base de datos:', error.message);
    process.exit(1);
  }
};

seedDatabase();
