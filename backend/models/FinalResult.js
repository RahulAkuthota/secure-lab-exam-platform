import mongoose from "mongoose";

const questionResultSchema = new mongoose.Schema({
    questionIndex: {
        type: Number,
        required: true,
    },
    score: {
        type: Number,
        required: true,
        min: 0,
    },
    totalPossible: {
        type: Number,
        required: true,
        min: 0,
    },
    passedCases: {
        type: Number,
        required: true,
    },
    manualAdjustment: {
        type: Number,
        default: 0,
    },
    adjustmentNote: {
        type: String,
        default: "",
    },
});

const finalResultSchema = new mongoose.Schema(
    {
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
        rollNumber: {
            type: String,
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        questionResults: [questionResultSchema],
        totalScore: {
            type: Number,
            required: true,
        },
        totalPossible: {
            type: Number,
            required: true,
        },
        scorePercent: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Finalized", "Published"],
            default: "Finalized",
            index: true,
        },
        finalizedAt: {
            type: Date,
            default: Date.now,
        },
        publishedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// One final result record per student per exam
finalResultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

export const FinalResult = mongoose.model("FinalResult", finalResultSchema);
