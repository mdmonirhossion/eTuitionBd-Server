import express from 'express';
import { User } from '../models/User.js';
import { Tuition } from '../models/Tuition.js';
import { Application } from '../models/Application.js';
import { Payment } from '../models/Payment.js';
import { verifyToken, verifyAdmin, verifyStudent, verifyTutor } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stats/admin - Admin Dashboard Aggregated Analytics
router.get('/admin', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const tutors = await User.countDocuments({ role: 'tutor' });
    const admins = await User.countDocuments({ role: 'admin' });

    const totalTuitions = await Tuition.countDocuments();
    const pendingTuitions = await Tuition.countDocuments({ status: 'pending' });
    const approvedTuitions = await Tuition.countDocuments({ status: 'approved' });
    const assignedTuitions = await Tuition.countDocuments({ status: 'assigned' });
    const rejectedTuitions = await Tuition.countDocuments({ status: 'rejected' });

    const totalApplications = await Application.countDocuments();

    const payments = await Payment.find();
    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    // Revenue by month chart data (last 6 months mock/agg)
    const statusChartData = [
      { name: 'Pending', count: pendingTuitions },
      { name: 'Approved', count: approvedTuitions },
      { name: 'Assigned', count: assignedTuitions },
      { name: 'Rejected', count: rejectedTuitions },
    ];

    const roleChartData = [
      { name: 'Students', count: students },
      { name: 'Tutors', count: tutors },
      { name: 'Admins', count: admins },
    ];

    res.json({
      overview: {
        totalUsers,
        students,
        tutors,
        admins,
        totalTuitions,
        pendingTuitions,
        approvedTuitions,
        assignedTuitions,
        totalApplications,
        totalRevenue,
      },
      statusChartData,
      roleChartData,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/student - Student Dashboard Analytics
router.get('/student', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const totalTuitions = await Tuition.countDocuments({ studentId: req.user._id });
    const pendingTuitions = await Tuition.countDocuments({ studentId: req.user._id, status: 'pending' });
    const approvedTuitions = await Tuition.countDocuments({ studentId: req.user._id, status: 'approved' });
    const assignedTuitions = await Tuition.countDocuments({ studentId: req.user._id, status: 'assigned' });

    const payments = await Payment.find({ studentId: req.user._id });
    const totalSpent = payments.reduce((acc, p) => acc + p.amount, 0);

    res.json({
      totalTuitions,
      pendingTuitions,
      approvedTuitions,
      assignedTuitions,
      totalPayments: payments.length,
      totalSpent,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/stats/tutor - Tutor Dashboard Analytics
router.get('/tutor', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const totalApplications = await Application.countDocuments({ tutorId: req.user._id });
    const pendingApplications = await Application.countDocuments({ tutorId: req.user._id, status: 'pending' });
    const acceptedApplications = await Application.countDocuments({ tutorId: req.user._id, status: 'accepted' });
    const approvedApplications = await Application.countDocuments({ tutorId: req.user._id, status: 'approved' });

    const payments = await Payment.find({ tutorId: req.user._id });
    const totalEarnings = payments.reduce((acc, p) => acc + p.amount, 0);

    res.json({
      totalApplications,
      pendingApplications,
      acceptedApplications,
      approvedApplications,
      ongoingTuitions: approvedApplications,
      totalEarnings,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
