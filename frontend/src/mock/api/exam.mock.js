import { examData } from "../data/exam.data";

export function fetchExamMock() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(examData);
    }, 500); // simulate server delay
  });
}
