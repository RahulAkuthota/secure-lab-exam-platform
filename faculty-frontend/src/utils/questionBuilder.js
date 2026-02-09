export const createEmptyCase = () => ({ input: "", expectedOutput: "" });

export const createEmptyQuestion = () => ({
  title: "",
  description: "",
  publicTestCases: [createEmptyCase(), createEmptyCase()],
  privateTestCases: Array.from({ length: 10 }, () => createEmptyCase()),
});

export const validateQuestions = (questions) => {
  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i];
    if (!question.title.trim() || !question.description.trim()) {
      throw new Error(`Question ${i + 1}: title and description are required`);
    }
    if (!Array.isArray(question.publicTestCases) || question.publicTestCases.length < 2) {
      throw new Error(`Question ${i + 1}: at least 2 public test cases required`);
    }
    if (!Array.isArray(question.privateTestCases) || question.privateTestCases.length < 10) {
      throw new Error(`Question ${i + 1}: at least 10 private test cases required`);
    }
    const invalidCase = [...question.publicTestCases, ...question.privateTestCases].find(
      (testCase) =>
        !testCase ||
        !String(testCase.input || "").trim() ||
        !String(testCase.expectedOutput || "").trim()
    );
    if (invalidCase) {
      throw new Error(`Question ${i + 1}: all test cases require input and expected output`);
    }
  }
};
