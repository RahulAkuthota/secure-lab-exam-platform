import { createClient } from "redis";
import { MongoClient } from "mongodb";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const MONGO_URI = process.env.MONGO_URI;

const redis = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
});

const mongoClient = new MongoClient(MONGO_URI);

const EXECUTOR_IMAGES = {
  c: "executor-c",
  cpp: "executor-cpp",
  java: "executor-java",
};

// temp directory for code execution
const BASE_DIR = "/tmp/executions";

async function start() {
  await redis.connect();
  await mongoClient.connect();
  console.log("✅ Worker connected to Redis & Mongo");

  const db = mongoClient.db();
  const results = db.collection("results");

  while (true) {
    try {
      // BLOCKING pop → waits until a job is available
      const job = await redis.brPop("answerQueue", 0);
      const payload = JSON.parse(job.element);

      console.log("📥 Job received:", payload.studentId);

      const output = await runCode(payload);

      await results.insertOne({
        studentId: payload.studentId,
        examId: payload.examId,
        language: payload.language,
        output,
        timestamp: new Date(),
      });

      console.log("✅ Job completed:", payload.studentId);
    } catch (err) {
      console.error("❌ Worker error:", err.message);
    }
  }
}

async function runCode(job) {
  const { language, code } = job;
  const image = EXECUTOR_IMAGES[language];

  if (!image) {
    throw new Error("Unsupported language");
  }

  const execId = crypto.randomUUID();
  const workDir = path.join(BASE_DIR, execId);
  fs.mkdirSync(workDir, { recursive: true });

  // write code file
  if (language === "c") fs.writeFileSync(`${workDir}/main.c`, code);
  if (language === "cpp") fs.writeFileSync(`${workDir}/main.cpp`, code);
  if (language === "java") fs.writeFileSync(`${workDir}/Main.java`, code);

  return new Promise((resolve) => {
    const cmd = `
docker run --rm \
  --network none \
  --memory 128m \
  --cpus 0.5 \
  --pids-limit 64 \
  -v ${workDir}:/sandbox \
  ${image}
`;

    exec(cmd, { timeout: 3000 }, (err, stdout, stderr) => {
      fs.rmSync(workDir, { recursive: true, force: true });

      if (err) {
        resolve(stderr || err.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

start();
