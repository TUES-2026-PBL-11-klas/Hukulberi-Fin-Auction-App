import express from 'express';
import dotenv from 'dotenv';
import { createUserTable } from './models/userModel';
import { createAuctionTable } from './models/auctionModel';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('BidMaster API is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const startServer = async () => {
    await createUserTable();
    await createAuctionTable();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();
