import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
//import { runMigrations } from './migrate';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import bidRoutes from './routes/bidRoutes';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('BidMaster API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bids', bidRoutes);

const startServer = async () => {
    //await runMigrations();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();
