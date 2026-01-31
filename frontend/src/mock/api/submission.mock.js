export function submitCodeMock({ code, question }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: "SUCCESS",
          results: question.testCases.map((tc, index) => ({
            id: index + 1,
            input: tc.input,
            expected: tc.output,
            actual: tc.output,
            passed: true
          }))
        });
      }, 800);
    });
  }
  