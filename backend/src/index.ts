import express from 'express';
import dotenv from 'dotenv';
import { createUserTable } from './models/userModel';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('BidMaster API is running');
});

app.use('/api/auth', authRoutes);

const startServer = async () => {
    await createUserTable();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();
