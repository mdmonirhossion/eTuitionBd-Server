import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    let serviceAccount = null;

    // 1. Try reading local JSON key files from server root first
    const serverDir = path.resolve(__dirname, '../../');
    if (fs.existsSync(serverDir)) {
      const files = fs.readdirSync(serverDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        if (['package.json', 'package-lock.json', 'vercel.json'].includes(file)) continue;
        const fullPath = path.join(serverDir, file);
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          if (content.type === 'service_account' && content.private_key) {
            serviceAccount = content;
            console.log(`🔑 Loaded Firebase Service Account from local file: ${file}`);
            break;
          }
        } catch {
          // ignore non-service account files
        }
      }
    }

    // 2. Try process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 if no local file found
    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const cleanBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.trim().replace(/[\r\n\s]+/g, '');
      const decoded = Buffer.from(cleanBase64, 'base64').toString('utf8');
      serviceAccount = JSON.parse(decoded);
    }
    // 3. Try process.env.FIREBASE_SERVICE_ACCOUNT (raw JSON string)
    else if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (serviceAccount) {
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin SDK initialized successfully.');
      return admin.app();
    } else {
      console.warn('⚠️ Firebase Admin SDK not initialized: No service account credentials found.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
  }

  return null;
};
