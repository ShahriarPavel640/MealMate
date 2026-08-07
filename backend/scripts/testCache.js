import redisClient, { connectRedis } from '../utils/redisClient.js';

const testCache = async () => {
  await connectRedis();

  console.log("Redis Client IsOpen:", redisClient.isOpen);

  // 1. Set a dummy key
  await redisClient.setEx("cache:test", 10, JSON.stringify({ message: "hello" }));
  console.log("Set cache:test");

  // 2. Get the key
  const val = await redisClient.get("cache:test");
  console.log("Got cache:test:", val);

  // 3. Delete the key (simulating active invalidation)
  await redisClient.del("cache:test");
  const val2 = await redisClient.get("cache:test");
  console.log("Got cache:test after del:", val2);

  await redisClient.quit();
  console.log("Done");
};

testCache();
