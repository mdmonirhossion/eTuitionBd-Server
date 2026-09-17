import express from 'express';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { User } from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Helper for setting optional Firebase Custom User Claims if Admin SDK is configured
const setFirebaseCustomClaims = async (uid, role) => {
  if (!uid || !role) return;
  try {
    if (admin.apps && admin.apps.length > 0) {
      await admin.auth().setCustomUserClaims(uid, { role });
    }
  } catch (err) {
    // Non-blocking: skip if firebase admin claim setting fails
    console.warn('Firebase custom claims setting skipped:', err.message);
  }
};

// POST /api/auth/jwt - Login/Register sync with Firebase & return backend JWT
router.post('/jwt', async (req, res, next) => {
  try {
    const { name, email, photoURL, firebaseUid, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    // Determine initial role (default to 'student' unless 'tutor' or 'admin' is explicitly provided)
    const assignedRole = (role && ['student', 'tutor', 'admin'].includes(role)) ? role : 'student';

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user profile in MongoDB with requested role
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        photoURL: photoURL || '',
        firebaseUid: firebaseUid || '',
        role: assignedRole,
      });
    } else {
      // Update existing user profile with updated info if provided
      let updated = false;
      if (firebaseUid && !user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        updated = true;
      }
      if (photoURL && !user.photoURL) {
        user.photoURL = photoURL;
        updated = true;
      }
      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }
      // Update role if explicitly provided during registration/sync and user is not an admin
      if (role && ['student', 'tutor'].includes(role) && user.role !== 'admin' && user.role !== role) {
        user.role = role;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    // Set optional Firebase Custom Claim if UID is present
    if (firebaseUid) {
      await setFirebaseCustomClaims(firebaseUid, user.role);
    }

    // Generate backend JWT
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        photoURL: user.photoURL,
      },
      process.env.JWT_SECRET || 'etuitionbd_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photoURL: user.photoURL,
        verified: user.verified,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Fetch current user info
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
