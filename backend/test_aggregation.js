import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Exam } from './models/Exam.js';
import { Student } from './models/Student.js';
import { Submission } from './models/Submission.js';

dotenv.config();

const test = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        const resultsCollection = mongoose.connection.collection("results");

        // Find an exam with some results to test with
        const sampleResult = await resultsCollection.findOne({});
        if (!sampleResult) {
            console.log("No results found in 'results' collection. Skipping aggregation test.");
            process.exit(0);
        }

        const examId = sampleResult.examId;
        console.log(`Testing aggregation for Exam ID: ${examId}`);

        const bestScores = await resultsCollection
            .aggregate([
                {
                    $match: {
                        examId: examId.toString(),
                        submissionType: "private",
                    },
                },
                {
                    $group: {
                        _id: {
                            studentId: "$studentId",
                            questionIndex: "$questionIndex",
                        },
                        bestPassedCases: { $max: "$evaluation.passedCases" },
                        totalCases: { $first: "$evaluation.totalCases" },
                        doc: { $first: "$$ROOT" },
                    },
                },
                {
                    $group: {
                        _id: "$_id.studentId",
                        rollNumber: { $first: "$doc.rollNumber" },
                        questions: {
                            $push: {
                                questionIndex: "$_id.questionIndex",
                                passedCases: "$bestPassedCases",
                                totalCases: "$totalCases",
                            },
                        },
                        totalPassed: { $sum: "$bestPassedCases" },
                        totalPossible: { $sum: "$totalCases" },
                    },
                },
            ])
            .toArray();

        console.log(`Found ${bestScores.length} students with results.`);
        if (bestScores.length > 0) {
            console.log("Sample aggregated student data:", JSON.stringify(bestScores[0], null, 2));
        }

        await mongoose.disconnect();
        console.log("Disconnected.");
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
};

test();
