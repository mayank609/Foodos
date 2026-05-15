import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import searchRouter from './routes/search.js';
import favoritesRouter from './routes/favorites.js';
import historyRouter from './routes/history.js';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/search', searchRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/history', historyRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
