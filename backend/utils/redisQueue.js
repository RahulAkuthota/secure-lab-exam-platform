import { createClient } from "redis";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const SUBMISSION_QUEUE = process.env.REDIS_SUBMISSION_QUEUE || "submissionQueue";

let redisClient;
let connectPromise;

const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
    });

    redisClient.on("error", (error) => {
      console.error("Redis client error:", error.message);
    });
  }

  if (!redisClient.isOpen) {
    connectPromise = connectPromise || redisClient.connect();
    await connectPromise;
    connectPromise = null;
  }

  return redisClient;
};

export const enqueueSubmissionJob = async (payload) => {
  const client = await getRedisClient();
  await client.lPush(SUBMISSION_QUEUE, JSON.stringify(payload));
  return {
    queue: SUBMISSION_QUEUE,
  };
};
