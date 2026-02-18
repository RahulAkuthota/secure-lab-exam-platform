import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
      trim: true,
    },
    expectedOutput: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    publicTestCases: {
      type: [testCaseSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 2,
        message: "Each question must have at least 2 public test cases.",
      },
    },
    privateTestCases: {
      type: [testCaseSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length >= 10,
        message: "Each question must have at least 10 private test cases.",
      },
    },
  },
  { _id: false }
);

const questionPaperSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
      unique: true,
      index: true,
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const QuestionPaper = mongoose.model("QuestionPaper", questionPaperSchema);
