import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// GET /api/tutors/latest - Public: Latest tutors for home page
router.get('/latest', async (req, res, next) => {
  try {
    const tutors = await User.find({ role: 'tutor' })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('-__v');
    res.json(tutors);
  } catch (error) {
    next(error);
  }
});

// GET /api/tutors - Public: List all tutors with optional search query
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = { role: 'tutor' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const tutors = await User.find(filter).sort({ createdAt: -1 }).select('-__v');
    res.json(tutors);
  } catch (error) {
    next(error);
  }
});

// GET /api/tutors/:id - Public: Single tutor profile
router.get('/:id', async (req, res, next) => {
  try {
    const tutor = await User.findById(req.params.id).select('-__v');
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ message: 'Tutor profile not found.' });
    }
    res.json(tutor);
  } catch (error) {
    next(error);
  }
});

export default router;
