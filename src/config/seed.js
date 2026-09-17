import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Tuition } from '../models/Tuition.js';
import { Application } from '../models/Application.js';
import { Payment } from '../models/Payment.js';

dotenv.config();

export const seedSampleData = async () => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@etuitionbd.com' });
    if (existingAdmin) {
      console.log('Database already initialized. Skipping seed.');
      return;
    }

    console.log('Seeding initial sample data into MongoDB...');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@etuitionbd.com',
      phone: '+8801711111111',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: 'admin',
      verified: true,
    });

    const student1 = await User.create({
      name: 'Monir Hossain',
      email: 'student@etuitionbd.com',
      phone: '+8801722222222',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'student',
      verified: true,
    });

    const tutor1 = await User.create({
      name: 'Dr. Tanvir Ahmed',
      email: 'tutor@etuitionbd.com',
      phone: '+8801733333333',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'tutor',
      verified: true,
    });

    const tutor2 = await User.create({
      name: 'Nusrat Jahan',
      email: 'nusrat@etuitionbd.com',
      phone: '+8801744444444',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'tutor',
      verified: true,
    });

    // 2. Create Tuitions
    const tuition1 = await Tuition.create({
      studentId: student1._id,
      title: 'Need Experienced Math & Physics Tutor for HSC Candidate',
      subject: 'Mathematics',
      className: 'HSC',
      location: 'Dhanmondi, Dhaka',
      salary: 10000,
      daysPerWeek: 4,
      schedule: '6:00 PM - 8:00 PM (Evening)',
      description: 'Looking for a dedicated tutor from BUET/DU for HSC higher math and physics preparation.',
      status: 'approved',
    });

    const tuition2 = await Tuition.create({
      studentId: student1._id,
      title: 'English Spoken & Grammar Home Tutor Needed',
      subject: 'English',
      className: 'Class 8',
      location: 'Mirpur 10, Dhaka',
      salary: 6000,
      daysPerWeek: 3,
      schedule: '4:00 PM - 5:30 PM',
      description: 'Focus on English grammar basics and spoken confidence.',
      status: 'approved',
    });

    const tuition3 = await Tuition.create({
      studentId: student1._id,
      title: 'ICT & Computer Science Tutor for SSC',
      subject: 'ICT',
      className: 'SSC',
      location: 'Uttara, Dhaka',
      salary: 8000,
      daysPerWeek: 3,
      schedule: '7:00 PM',
      description: 'Practical coding and ICT theory.',
      status: 'pending',
    });

    // 3. Create Applications
    const app1 = await Application.create({
      tuitionId: tuition1._id,
      tutorId: tutor1._id,
      studentId: student1._id,
      qualifications: 'B.Sc in Electrical Engineering, BUET (CGPA 3.85)',
      experience: '5 years experience tutoring HSC Math & Physics',
      expectedSalary: 10000,
      status: 'accepted',
    });

    const app2 = await Application.create({
      tuitionId: tuition2._id,
      tutorId: tutor2._id,
      studentId: student1._id,
      qualifications: 'MA in English Literature, Dhaka University',
      experience: '3 years experience teaching Class 6-10 English',
      expectedSalary: 6000,
      status: 'pending',
    });

    console.log('Sample data seeded successfully! ');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
};
