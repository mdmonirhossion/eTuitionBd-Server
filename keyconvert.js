import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findKeyFile() {
    // 1. Check exact filename
    const defaultPath = path.join(__dirname, 'firebase-admin-service-key.json');
    if (fs.existsSync(defaultPath)) return defaultPath;

    // 2. Scan server directory for any Firebase service account JSON file
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.json'));
    for (const file of files) {
        if (file === 'package.json' || file === 'package-lock.json' || file === 'vercel.json') continue;
        const fullPath = path.join(__dirname, file);
        try {
            const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (content.type === 'service_account' && content.private_key) {
                return fullPath;
            }
        } catch {
            // Ignore non-JSON or invalid files
        }
    }
    return null;
}

const keyFilePath = findKeyFile();

if (keyFilePath) {
    try {
        const key = fs.readFileSync(keyFilePath);
        const base64 = key.toString('base64');
        console.log('\n Base64 Key Generated Successfully from:', path.basename(keyFilePath));
        console.log('--------------------------------------------------');
        console.log(base64);
        console.log('--------------------------------------------------\n');
    } catch (err) {
        console.error(' Error reading key file:', err.message);
    }
} else {
    console.error(' No Firebase Service Account JSON file found in the server directory!');
    console.log(' Please download the JSON key from Firebase and place it in your server folder.');
}