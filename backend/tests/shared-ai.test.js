import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index.js';
import prisma from '../prismaClient.js';

let restaurantId;

beforeAll(async () => {
  restaurantId = 999999;
});

describe('Shared API - AI', () => {
  it('should return no reviews available for non-existent restaurant', async () => {
    const res = await request(app).get('/api/ai/summarize-reviews/999999');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.summary).toBe("No reviews available to summarize yet.");
  });

  it('should return 401 for unauthenticated request calling generate-description', async () => {
    const res = await request(app).post('/api/ai/generate-description').send({
      name: "Burger"
    });
    
    expect([401, 403]).toContain(res.statusCode);
  });
});
