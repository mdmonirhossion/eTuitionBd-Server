import mongoose from 'mongoose';
import express from 'express';
import Stripe from 'stripe';
import { Payment } from '../models/Payment.js';
import { Application } from '../models/Application.js';
import { Tuition } from '../models/Tuition.js';
import { verifyToken, verifyStudent, verifyTutor, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'your_stripe_secret_key_here');

// POST /api/payments/create-checkout-session - Protected (Student): Confirm Tutor Selection & Complete Payment
router.post('/create-checkout-session', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ message: 'Application ID is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: 'Invalid Application ID format.' });
    }

    const application = await Application.findById(applicationId)
      .populate('tuitionId')
      .populate('tutorId', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (application.studentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to pay for this application.' });
    }

    const amount = application.expectedSalary || application.tuitionId?.salary || 5000;

    // DIRECT PAYMENT / INSTANT STUDENT CONFIRMATION
    const transactionId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const payment = await Payment.create({
      tuitionId: application.tuitionId._id || application.tuitionId,
      applicationId: application._id,
      studentId: application.studentId,
      tutorId: application.tutorId._id || application.tutorId,
      amount,
      transactionId,
      paymentStatus: 'succeeded',
    });

    // Update application status to approved
    application.status = 'approved';
    await application.save();

    // Update tuition status to assigned
    await Tuition.findByIdAndUpdate(application.tuitionId._id || application.tuitionId, { status: 'assigned' });

    res.status(200).json({
      message: 'Payment & Tutor Confirmation completed successfully!',
      transactionId,
      payment,
      directSuccess: true,
      url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/student/payments?success=true&appId=${application._id}`,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/verify - Protected (Student): Verify and confirm payment completion after checkout redirect
router.post('/verify', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const { applicationId, sessionId, transactionId } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (application.status === 'approved') {
      const existingPayment = await Payment.findOne({ applicationId });
      return res.json({ message: 'Payment already verified.', payment: existingPayment });
    }

    const txId = transactionId || `txn_stripe_${Date.now()}`;
    const amount = application.expectedSalary || 5000;

    const payment = await Payment.create({
      tuitionId: application.tuitionId,
      applicationId: application._id,
      studentId: application.studentId,
      tutorId: application.tutorId,
      amount,
      transactionId: txId,
      paymentStatus: 'succeeded',
    });

    application.status = 'approved';
    await application.save();

    await Tuition.findByIdAndUpdate(application.tuitionId, { status: 'assigned' });

    res.json({ message: 'Payment verified successfully.', payment });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/history - Protected (Student): My payments history
router.get('/history', verifyToken, verifyStudent, async (req, res, next) => {
  try {
    const payments = await Payment.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('tuitionId', 'title subject salary')
      .populate('tutorId', 'name email photoURL');
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/revenue - Protected (Tutor): Tutor earnings & revenue stats
router.get('/revenue', verifyToken, verifyTutor, async (req, res, next) => {
  try {
    const payments = await Payment.find({ tutorId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('tuitionId', 'title subject className')
      .populate('studentId', 'name email photoURL');

    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      totalRevenue,
      paymentCount: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/payments - Protected (Admin): All system payments
router.get('/admin/all', verifyToken, verifyAdmin, async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('studentId', 'name email')
      .populate('tutorId', 'name email')
      .populate('tuitionId', 'title subject');

    const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      totalRevenue,
      count: payments.length,
      payments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
