import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export async function get(key) {
  try {
    return await redis.get(key);
  } catch (error) {
    console.error('Redis GET error:', error);
    return null; // Oder einen anderen Standardwert
  }
}

export async function set(key, value) {
  try {
    return await redis.set(key, value);
  } catch (error) {
    console.error('Redis SET error:', error);
    return null;
  }
}

export async function del(key) {
  try {
    return await redis.del(key);
  } catch (error) {
    console.error('Redis DEL error:', error);
    return null;
  }
}