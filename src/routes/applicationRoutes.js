import mongoose from 'mongoose';
import express from 'express';
import { Application } from '../models/Application.js';
import { Tuition } from '../models/Tuition.js';
import { verifyToken, verifyTutor, verifyStudent, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// POST /api/applications - Protected (Tutor): Apply to a tuition
router.post('/', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const { tuitionId, qualifications, experience, expectedSalary } = req.body;

    if (!tuitionId || !qualifications || !experience || !expectedSalary) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(tuitionId)) {
      return res.status(400).json({ message: 'Invalid Tuition ID format.' });
    }

    const tuition = await Tuition.findById(tuitionId);
    if (!tuition) {
      return res.status(404).json({ message: 'Tuition not found.' });
    }

    if (tuition.status !== 'approved') {
      return res.status(400).json({ message: 'Applications are only allowed for approved tuitions.' });
    }

    // Check if tutor is trying to apply to their own tuition (if tutor is also a student)
    if (tuition.studentId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot apply to your own tuition post.' });
    }

    // Check duplicate application
    const existing = await Application.findOne({ tuitionId, tutorId: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this tuition.' });
    }

    const application = await Application.create({
      tuitionId,
      tutorId: req.user._id,
      studentId: tuition.studentId,
      qualifications,
      experience,
      expectedSalary: Number(expectedSalary),
      status: 'pending',
    });

    res.status(201).json(application);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already applied for this tuition.' });
    }
    next(error);
  }
});

// GET /api/applications/my - Protected (Tutor): List tutor's applications
router.get('/my', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const applications = await Application.find({ tutorId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('tuitionId')
      .populate('studentId', 'name email phone photoURL');
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// GET /api/applications/ongoing - Protected (Tutor): Tutor's ongoing tuitions (approved applications)
router.get('/ongoing', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const applications = await Application.find({
      tutorId: req.user._id,
      status: 'approved',
    })
      .sort({ updatedAt: -1 })
      .populate('tuitionId')
      .populate('studentId', 'name email phone photoURL');
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// GET /api/applications/student - Protected (Student): List applications received by logged-in student
router.get('/student', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const applications = await Application.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('tuitionId')
      .populate('tutorId', 'name email phone photoURL verified');
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// GET /api/applications/tuition/:tuitionId - Protected (Student): List applications for specific tuition
router.get('/tuition/:tuitionId', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.tuitionId)) {
      return res.status(400).json({ message: 'Invalid Tuition ID format.' });
    }

    const applications = await Application.find({
      tuitionId: req.params.tuitionId,
      studentId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .populate('tutorId', 'name email phone photoURL verified');
    res.json(applications);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/applications/:id/status - Protected (Student): Accept/Reject/Approve application
router.patch('/:id/status', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'approved', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified.' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Application ID format.' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (application.studentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to manage this application.' });
    }

    application.status = status;
    await application.save();

    if (status === 'approved') {
      await Tuition.findByIdAndUpdate(application.tuitionId, { status: 'assigned' });
    }

    res.json(application);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/applications/:id - Protected (Tutor/Admin): Delete/withdraw application
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (application.tutorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this application.' });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application withdrawn successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
