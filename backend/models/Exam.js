import mongoose from "mongoose";

export const SUPPORTED_LANGUAGES = ["c", "cpp", "java", "python", "javascript"];

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    allowedLanguages: {
      type: [String],
      default: [],
      validate: {
        validator: (value) =>
          Array.isArray(value) &&
          value.every((language) => SUPPORTED_LANGUAGES.includes(language)),
        message: "allowedLanguages contains unsupported language.",
      },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Exam = mongoose.model("Exam", examSchema);
