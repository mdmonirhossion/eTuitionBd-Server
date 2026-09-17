import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized access. Token missing.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'etuitionbd_super_secret_jwt_key_2026');

    // Attach decoded user info to request
    req.user = decoded;
    
    // Optionally ensure user still exists in DB
    const dbUser = await User.findById(decoded._id);
    if (!dbUser) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }
    
    // Ensure role matches dbUser
    req.user.role = dbUser.role;
    req.user.email = dbUser.email;
    req.dbUser = dbUser;

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden. Invalid or expired token.' });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden. Admin privileges required.' });
  }
};

export const verifyStudent = (req, res, next) => {
  if (req.user && (req.user.role === 'student' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden. Student role required.' });
  }
};

export const verifyTutor = (req, res, next) => {
  if (req.user && (req.user.role === 'tutor' || req.user.role === 'admin')) {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden. Tutor role required.' });
  }
};
