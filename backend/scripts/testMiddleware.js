import redisClient, { connectRedis } from '../utils/redisClient.js';
import http from 'http';

const fetchUrl = (url) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        time: Date.now() - start,
        data
      }));
    }).on('error', reject);
  });
};

const runTests = async () => {
   try {
     await connectRedis();

     const endpoints = [
       { name: "Categories", path: "/api/customer/getCategories", cacheKey: "cache:categories" },
       { name: "All Restaurants (Page 1)", path: "/api/customer/getRestaurants", cacheKey: "cache:restaurants:all:1:9" },
       { name: "Search Restaurants", path: "/api/customer/searchRestaurant?name=pizza", cacheKey: "cache:restaurants:search:pizza:1:9" },
       { name: "Specific Restaurant (ID: 1)", path: "/api/customer/getRestaurant/1", cacheKey: "cache:restaurant:1" },
       { name: "Restaurant Reviews (ID: 1)", path: "/api/customer/reviews?restaurant_id=1", cacheKey: "cache:reviews:1" },
     ];

     for (const endpoint of endpoints) {
        console.log(`\n========================================`);
        console.log(`Testing Endpoint: ${endpoint.name}`);
        console.log(`Path: ${endpoint.path}`);
        console.log(`Expected Cache Key: ${endpoint.cacheKey}`);
        
        // Ensure clean slate
        await redisClient.del(endpoint.cacheKey);

        // Test 1: Hit DB
        const res1 = await fetchUrl(`http://localhost:5001${endpoint.path}`);
        console.log(`[DB Hit] Status: ${res1.statusCode} | Time: ${res1.time}ms`);

        // Verify cache was set
        const inCache = await redisClient.get(endpoint.cacheKey);
        console.log(`[Verify] Is data in Redis now?: ${!!inCache}`);
        if (!inCache) {
            console.error(`[ERROR] Cache was NOT set for ${endpoint.cacheKey}`);
        }

        // Test 2: Hit Cache
        const res2 = await fetchUrl(`http://localhost:5001${endpoint.path}`);
        console.log(`[Cache Hit] Status: ${res2.statusCode} | Time: ${res2.time}ms`);

        // Speed comparison
        if (res2.time < res1.time) {
             console.log(`[SUCCESS] Cache is faster by ${res1.time - res2.time}ms`);
        } else {
             console.log(`[WARNING] Cache was not significantly faster (often happens on local tiny DBs)`);
        }
     }

   } catch (e) {
     console.error(e);
   } finally {
     if(redisClient.isOpen) await redisClient.quit();
     process.exit(0);
   }
};

runTests();
