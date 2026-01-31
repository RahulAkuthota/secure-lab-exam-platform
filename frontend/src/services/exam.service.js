import { fetchExamMock } from "../mock/api/exam.mock";

export async function fetchExam() {
  return await fetchExamMock();
}
