import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    tuitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tuition',
      required: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    qualifications: {
      type: String,
      required: [true, 'Qualifications are required'],
    },
    experience: {
      type: String,
      required: [true, 'Experience details are required'],
    },
    expectedSalary: {
      type: Number,
      required: [true, 'Expected salary is required'],
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'approved'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Prevent duplicate applications from the same tutor for the same tuition
applicationSchema.index({ tuitionId: 1, tutorId: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
