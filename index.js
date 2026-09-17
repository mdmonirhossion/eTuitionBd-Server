import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedSampleData } from './src/config/seed.js';
import { initializeFirebase } from './src/config/firebase.js';

const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
initializeFirebase();

// Connect to MongoDB Atlas / local MongoDB
connectDB().then(() => {
  seedSampleData();
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export default app;

