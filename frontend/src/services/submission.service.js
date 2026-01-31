
//🔒 Later, only this file will change to call your LAN server.

import { submitCodeMock } from "../mock/api/submission.mock";

export async function submitCode(payload) {
  return await submitCodeMock(payload);
}
