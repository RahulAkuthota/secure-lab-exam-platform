export const examData = {
    id: "EXAM001",
    title: "Secure Coding Test",
    durationMinutes: 2,
    allowedLanguages: ["c", "cpp", "java", "python"],
    questions: [
      {
        id: "Q1",
        title: "Sum of Two Numbers",
        description:
          "Given two integers as input, print their sum.",
        sampleInput: "2 3",
        sampleOutput: "5",
        testCases: [
          { input: "2 3", output: "5" },
          { input: "10 20", output: "30" }
        ]
      },
      {
        id: "Q2",
        title: "Multiply Two Numbers",
        description:
          "Given two integers as input, print their product.",
        sampleInput: "3 4",
        sampleOutput: "12",
        testCases: [
          { input: "3 4", output: "12" },
          { input: "5 6", output: "30" }
        ]
      }
    ]
  };
  