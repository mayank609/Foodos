import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getFavourites, addFavourite, removeFavourite } from '../services/database.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: AuthRequest, res: Response) => {
  const data = await getFavourites(req.userId!);
  res.json(data);
});

const AddSchema = z.object({
  restaurantId: z.string().uuid(),
  menuItemId: z.string().uuid().optional(),
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = AddSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { restaurantId, menuItemId = null } = parsed.data;
  await addFavourite(req.userId!, restaurantId, menuItemId);
  res.status(201).json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  await removeFavourite(req.userId!, req.params.id);
  res.json({ ok: true });
});

export default router;
