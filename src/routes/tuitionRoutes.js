import express from 'express';
import { Tuition } from '../models/Tuition.js';
import { verifyToken, verifyStudent, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tuitions/latest - Public: Latest approved tuitions for homepage
router.get('/latest', async (req, res, next) => {
  try {
    const tuitions = await Tuition.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('studentId', 'name photoURL email');
    res.json(tuitions);
  } catch (error) {
    next(error);
  }
});

// GET /api/tuitions/my - Protected (Student): My created tuitions
router.get('/my', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const tuitions = await Tuition.find({ studentId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(tuitions);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/tuitions - Protected (Admin): All tuitions for moderation
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const tuitions = await Tuition.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('studentId', 'name email phone photoURL');

    const total = await Tuition.countDocuments(filter);

    res.json({
      tuitions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tuitions - Public: Search, filter, sort, pagination
router.get('/', async (req, res, next) => {
  try {
    const { search, className, subject, location, sort, page = 1, limit = 6 } = req.query;

    const filter = { status: 'approved' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (className && className !== 'All') {
      filter.className = { $regex: `^${className}$`, $options: 'i' };
    }

    if (subject && subject !== 'All') {
      filter.subject = { $regex: subject, $options: 'i' };
    }

    if (location && location !== 'All') {
      filter.location = { $regex: location, $options: 'i' };
    }

    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'budget_asc') sortOption = { salary: 1 };
    if (sort === 'budget_desc') sortOption = { salary: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const tuitions = await Tuition.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .populate('studentId', 'name photoURL email');

    const total = await Tuition.countDocuments(filter);

    res.json({
      tuitions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tuitions/:id - Public/Protected: Get single tuition by ID
router.get('/:id', async (req, res, next) => {
  try {
    const tuition = await Tuition.findById(req.params.id)
      .populate('studentId', 'name photoURL email phone role');

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition post not found.' });
    }
    res.json(tuition);
  } catch (error) {
    next(error);
  }
});

// POST /api/tuitions - Protected (Student): Post new tuition
router.post('/', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const { title, subject, className, location, salary, daysPerWeek, schedule, description } = req.body;

    if (!title || !subject || !className || !location || !salary) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    const tuition = await Tuition.create({
      studentId: req.user._id,
      title,
      subject,
      className,
      location,
      salary: Number(salary),
      daysPerWeek: Number(daysPerWeek) || 3,
      schedule: schedule || 'Evening',
      description: description || '',
      status: 'approved',
    });

    res.status(201).json(tuition);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tuitions/:id - Protected (Student): Update own tuition
router.patch('/:id', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const tuition = await Tuition.findById(req.params.id);

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found.' });
    }

    // Ownership check (unless admin)
    if (tuition.studentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this tuition.' });
    }

    const { title, subject, className, location, salary, daysPerWeek, schedule, description } = req.body;

    if (title) tuition.title = title;
    if (subject) tuition.subject = subject;
    if (className) tuition.className = className;
    if (location) tuition.location = location;
    if (salary) tuition.salary = Number(salary);
    if (daysPerWeek) tuition.daysPerWeek = Number(daysPerWeek);
    if (schedule) tuition.schedule = schedule;
    if (description !== undefined) tuition.description = description;

    // Reset to pending if edited by student
    if (req.user.role !== 'admin') {
      tuition.status = 'pending';
    }

    await tuition.save();
    res.json(tuition);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tuitions/:id/status - Protected (Admin): Approve or Reject tuition
router.patch('/:id/status', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const tuition = await Tuition.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('studentId', 'name email');

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found.' });
    }

    res.json(tuition);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tuitions/:id - Protected (Student/Admin): Delete tuition
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const tuition = await Tuition.findById(req.params.id);

    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found.' });
    }

    if (tuition.studentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this tuition.' });
    }

    await Tuition.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tuition deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
