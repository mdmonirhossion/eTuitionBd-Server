import express from 'express';
import { User } from '../models/User.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tutors/latest - Public: Latest tutors for home page
router.get('/tutors/latest', async (req, res, next) => {
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
router.get('/tutors', async (req, res, next) => {
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
router.get('/tutors/:id', async (req, res, next) => {
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

// PATCH /api/users/profile - Protected: Update own profile
router.patch('/profile', verifyToken, async (req, res, next) => {
  try {
    const { name, phone, photoURL, role } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (photoURL !== undefined) user.photoURL = photoURL;
    if (role && ['student', 'tutor'].includes(role) && user.role !== 'admin') {
      user.role = role;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - Protected (Admin): List all platform users
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role && role !== 'All') filter.role = role;

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/users/:id/role - Protected (Admin): Change user role
router.patch('/admin/:id/role', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'tutor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Safeguard: Admin cannot demote themselves if they are the only admin
    if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot demote the only remaining Admin.' });
      }
    }

    user.role = role;
    await user.save();

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/users/:id - Protected (Admin): Delete user
router.delete('/admin/:id', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Safeguard: Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Admin cannot delete their own account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
