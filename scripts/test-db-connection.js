import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const uri = process.env.MONGODB_URI;

console.log('--- TESTE DE CONEXÃO COM O MONGODB ---');
console.log('URI configurada:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'NÃO DEFINIDA');

if (!uri) {
  console.error('❌ MONGODB_URI não encontrada no arquivo .env');
  process.exit(1);
}

async function run() {
  try {
    console.log('Tentando conectar ao MongoDB Atlas...');
    const start = Date.now();
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ Conexão estabelecida com sucesso em ${Date.now() - start}ms!`);
    console.log('Estado da conexão:', mongoose.connection.readyState === 1 ? 'Conectado (Ready)' : mongoose.connection.readyState);
    console.log('Nome do banco selecionado:', mongoose.connection.name || '(padrão: test)');
    
    // Testa listagem de coleções
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Coleções encontradas:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Conexão encerrada com sucesso.');
  } catch (err) {
    console.error('❌ ERRO AO CONECTAR COM O MONGODB:');
    console.error('Nome do erro:', err.name);
    console.error('Mensagem:', err.message);
    if (err.cause) console.error('Causa:', err.cause);
    if (err.reason) console.error('Razão:', err.reason);
  } finally {
    process.exit(0);
  }
}

run();
