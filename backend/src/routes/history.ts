import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getSearchHistory } from '../services/database.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const data = await getSearchHistory(req.userId!);
  res.json(data);
});

export default router;
