import { config } from 'dotenv';

config({ path: '.env.test' });

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});
