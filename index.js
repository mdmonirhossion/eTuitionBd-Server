import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedSampleData } from './src/config/seed.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas / local MongoDB
connectDB().then(() => {
  seedSampleData();
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

