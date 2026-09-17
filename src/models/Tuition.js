import mongoose from 'mongoose';

const tuitionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    className: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: 0,
    },
    daysPerWeek: {
      type: Number,
      default: 3,
      min: 1,
      max: 7,
    },
    schedule: {
      type: String,
      default: 'Evening',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'assigned'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Indexes for search, filter, and pagination performance
tuitionSchema.index({ subject: 'text', location: 'text', title: 'text' });
tuitionSchema.index({ status: 1, createdAt: -1 });
tuitionSchema.index({ salary: 1 });
tuitionSchema.index({ className: 1 });

export const Tuition = mongoose.model('Tuition', tuitionSchema);
