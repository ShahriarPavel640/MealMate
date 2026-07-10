import { vi } from 'vitest';

process.env.DB_NAME = 'test_food_panda';
process.env.NODE_ENV = 'test';

// Set mock values for environment variables checked during initialization
process.env.SSL_COMMERZ_STORE_ID = 'test_store_id';
process.env.SSL_COMMERZ_STORE_PASSWORD = 'test_store_password';

// Mock the SSLCommerz SDK so payment initiation behaves deterministically
vi.mock('sslcommerz-lts', () => {
  return {
    default: class {
      constructor(store_id, store_passwd, is_live) {}
      init(data) {
        return Promise.resolve({
          status: 'SUCCESS',
          GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/payment.php?tran_id=' + data.tran_id
        });
      }
    }
  };
});

// Mock Cloudinary module
vi.mock('cloudinary', () => {
  const mockCloudinary = {
    config: vi.fn(),
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/dummy-image.png'
      })
    }
  };
  return {
    v2: mockCloudinary,
    default: mockCloudinary
  };
});
