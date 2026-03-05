import mongoose from "mongoose";

const resultAuditSchema = new mongoose.Schema(
    {
        finalResultId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FinalResult",
            required: true,
            index: true,
        },
        facultyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Faculty",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
        },
        questionIndex: {
            type: Number,
            required: true,
        },
        oldScore: {
            type: Number,
            required: true,
        },
        newScore: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
    },
    { timestamps: { createdAt: "timestamp", updatedAt: false } }
);

export const ResultAudit = mongoose.model("ResultAudit", resultAuditSchema);
