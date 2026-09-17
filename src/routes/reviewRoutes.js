import express from 'express';
import { Review } from '../models/Review.js';
import { Application } from '../models/Application.js';
import { verifyToken, verifyStudent } from '../middleware/auth.js';

const router = express.Router();

// POST /api/reviews - Protected (Student): Add review for tutor
router.post('/', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const { tuitionId, tutorId, rating, comment } = req.body;

    if (!tuitionId || !tutorId || !rating) {
      return res.status(400).json({ message: 'Tuition ID, Tutor ID, and Rating are required.' });
    }

    // Verify student had an approved application/tuition with this tutor
    const validAssigned = await Application.findOne({
      tuitionId,
      tutorId,
      studentId: req.user._id,
      status: 'approved',
    });

    if (!validAssigned && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'You can only review tutors for completed/approved tuitions.' });
    }

    const review = await Review.create({
      tuitionId,
      tutorId,
      studentId: req.user._id,
      rating: Number(rating),
      comment: comment || '',
    });

    res.status(201).json(review);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this tutor for this tuition.' });
    }
    next(error);
  }
});

// GET /api/reviews/tutor/:tutorId - Public: Fetch tutor's reviews & average rating
router.get('/tutor/:tutorId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ tutorId: req.params.tutorId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name photoURL');

    const totalRatings = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = reviews.length > 0 ? (totalRatings / reviews.length).toFixed(1) : 0;

    res.json({
      reviews,
      count: reviews.length,
      avgRating: Number(avgRating),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
