import { createClient } from "redis";
import { MongoClient } from "mongodb";
import { exec, spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

/* ================= CONFIG ================= */

const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_SUBMISSION_QUEUE =
  process.env.REDIS_SUBMISSION_QUEUE || "submissionQueue";

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

const BASE_DIR = "/tmp/executions";
const EXECUTION_TIMEOUT_MS = 3000;
const MAX_OUTPUT_BYTES = 16 * 1024;

/* ================= LOGGING ================= */

function log(message) {
  const formatted = `[${new Date().toISOString()}] ${message}`;
  console.log(formatted);
  fs.appendFileSync("worker.log", formatted + "\n");
}

/* ================= EXECUTION ================= */

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
      const result = {
        stdout: stdout?.trim() || "",
        stderr: stderr?.trim() || "",
      };

      if (err) {
        err.stdout = result.stdout;
        err.stderr = result.stderr;
        reject(err);
        return;
      }

      resolve(result);
    });
  });
}

function appendChunkWithLimit(current, chunk, bytesUsed, maxBytes) {
  if (!chunk || bytesUsed >= maxBytes) {
    return { next: current, nextBytesUsed: bytesUsed, truncated: bytesUsed >= maxBytes };
  }

  const chunkBytes = Buffer.byteLength(chunk);

  if (bytesUsed + chunkBytes <= maxBytes) {
    return {
      next: current + chunk,
      nextBytesUsed: bytesUsed + chunkBytes,
      truncated: false,
    };
  }

  const allowedBytes = maxBytes - bytesUsed;
  const allowedPart = Buffer.from(chunk).subarray(0, allowedBytes).toString();

  return {
    next: current + allowedPart,
    nextBytesUsed: maxBytes,
    truncated: true,
  };
}

function runAttachedContainer(containerName, timeoutMs, maxOutputBytes) {
  return new Promise((resolve) => {
    const child = spawn("docker", ["start", "-a", containerName], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let stopRequested = false;
    let terminationReason = null;

    const stopContainer = (reason) => {
      if (!terminationReason) {
        terminationReason = reason;
      }

      if (stopRequested) {
        return;
      }
      stopRequested = true;

      // Ask Docker to stop quickly, then force-kill as a fallback.
      const stopper = spawn("docker", ["stop", "-t", "0", containerName], {
        stdio: "ignore",
      });
      stopper.on("error", () => {
        // Ignore stop errors; cleanup in finally still runs.
      });

      setTimeout(() => {
        const killer = spawn("docker", ["kill", containerName], { stdio: "ignore" });
        killer.on("error", () => {
          // Container may already be gone.
        });
      }, 500);
    };

    const timeoutHandle = setTimeout(() => {
      stopContainer(`Time limit exceeded (${timeoutMs} ms)`);
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      const updated = appendChunkWithLimit(stdout, text, stdoutBytes, maxOutputBytes);
      stdout = updated.next;
      stdoutBytes = updated.nextBytesUsed;

      if (updated.truncated) {
        stopContainer(`Output limit exceeded (${maxOutputBytes} bytes)`);
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      const updated = appendChunkWithLimit(stderr, text, stderrBytes, maxOutputBytes);
      stderr = updated.next;
      stderrBytes = updated.nextBytesUsed;

      if (updated.truncated) {
        stopContainer(`Output limit exceeded (${maxOutputBytes} bytes)`);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeoutHandle);
      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        error: terminationReason || err.message,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timeoutHandle);
      const fallbackError = code !== 0 ? `Execution failed with exit code ${code}` : null;

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        error: terminationReason || fallbackError,
      });
    });
  });
}

async function runCode(job) {
  const { language, code } = job;
  const image = EXECUTOR_IMAGES[language];

  if (!image) {
    throw new Error("Unsupported language");
  }

  const execId = crypto.randomUUID();
  const workDir = path.posix.join(BASE_DIR, execId);
  const containerName = `exec-${execId}`;

  fs.mkdirSync(workDir, { recursive: true });

  let sourceFilePath = "";
  let containerFilePath = "";

  if (language === "c") {
    sourceFilePath = `${workDir}/main.c`;
    containerFilePath = "/sandbox/main.c";
  }
  if (language === "cpp") {
    sourceFilePath = `${workDir}/main.cpp`;
    containerFilePath = "/sandbox/main.cpp";
  }
  if (language === "java") {
    sourceFilePath = `${workDir}/Main.java`;
    containerFilePath = "/sandbox/Main.java";
  }

  fs.writeFileSync(sourceFilePath, code);

  const createCmd = `docker create --name ${containerName} --network none --memory 128m --cpus 0.5 --pids-limit 64 ${image}`;
  const copyCmd = `docker cp "${sourceFilePath}" "${containerName}:${containerFilePath}"`;
  const startCmd = `docker start -a ${containerName}`;

  log("Running Docker Commands:");
  log(createCmd);
  log(copyCmd);
  log(`${startCmd} (timeout=${EXECUTION_TIMEOUT_MS}ms, maxOutput=${MAX_OUTPUT_BYTES} bytes)`);

  try {
    await runCommand(createCmd);
    await runCommand(copyCmd);
    const result = await runAttachedContainer(
      containerName,
      EXECUTION_TIMEOUT_MS,
      MAX_OUTPUT_BYTES
    );

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
    };
  } catch (err) {
    return {
      stdout: err.stdout || "",
      stderr: err.stderr || "",
      error: err.message,
    };
  } finally {
    try {
      await runCommand(`docker rm -f ${containerName}`);
    } catch (_ignore) {
      // Ignore cleanup errors.
    }

    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/* ================= WORKER LOOP ================= */

async function start() {
  try {
    await redis.connect();
    await mongoClient.connect();

    log("Worker connected to Redis & MongoDB");

    const db = mongoClient.db();
    const results = db.collection("results");

    while (true) {
      try {
        const job = await redis.brPop(REDIS_SUBMISSION_QUEUE, 0);
        const payload = JSON.parse(job.element);

        log("=====================================");
        log("NEW JOB RECEIVED");
        log(`Student: ${payload.studentId}`);
        log(`Exam: ${payload.examId}`);
        log(`Language: ${payload.language}`);
        log("=====================================");

        log("Submitted Code:");
        log(payload.code);
        log("=====================================");

        const startTime = Date.now();

        const executionResult = await runCode(payload);

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        log("Execution Output:");
        log("STDOUT:");
        log(executionResult.stdout);
        log("STDERR:");
        log(executionResult.stderr);
        log(`Execution Time: ${executionTime} ms`);
        log("=====================================");

        await results.insertOne({
          studentId: payload.studentId,
          examId: payload.examId,
          language: payload.language,
          code: payload.code,
          stdout: executionResult.stdout,
          stderr: executionResult.stderr,
          error: executionResult.error,
          executionTime,
          timestamp: new Date(),
        });

        log("Job stored in MongoDB");
      } catch (err) {
        log("Worker error:");
        log(err.stack || err.message);
      }
    }
  } catch (err) {
    log("Failed to start worker:");
    log(err.stack || err.message);
    process.exit(1);
  }
}

/* ================= START ================= */

start();
