import { Connection, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import bs58 from 'bs58';

async function initialize() {
  console.log('🚀 Initializing PoopFun...\n');

  // Check if .env exists
  if (!fs.existsSync('.env')) {
    console.log('❌ .env file not found');
    console.log('📝 Creating from .env.example...');
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Created .env file\n');
  }

  // Generate payer keypair if needed
  const envContent = fs.readFileSync('.env', 'utf-8');
  if (!envContent.includes('PAYER_PRIVATE_KEY=your_')) {
    console.log('✅ Payer keypair already configured\n');
  } else {
    console.log('🔑 Generating new payer keypair...');
    const payer = Keypair.generate();
    const privateKeyBase58 = bs58.encode(payer.secretKey);
    
    // Update .env
    const newEnvContent = envContent.replace(
      'PAYER_PRIVATE_KEY=your_base58_private_key_here',
      `PAYER_PRIVATE_KEY=${privateKeyBase58}`
    );
    fs.writeFileSync('.env', newEnvContent);
    
    console.log('✅ Payer wallet:', payer.publicKey.toString());
    console.log('⚠️  Fund this wallet with SOL for transactions\n');
  }

  console.log('✅ Initialization complete!');
  console.log('\nNext steps:');
  console.log('1. Fund the payer wallet with SOL');
  console.log('2. Update PLATFORM_WALLET in .env');
  console.log('3. Run: npm run dev');
}

initialize().catch(console.error);