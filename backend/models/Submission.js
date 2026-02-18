import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    selectedOption: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
    index: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true,
  },
  answers: {
    type: [answerSchema],
    default: [],
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  isSubmitted: {
    type: Boolean,
    default: false,
    index: true,
  },
});

// One submission record per student per exam.
submissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.model("Submission", submissionSchema);
