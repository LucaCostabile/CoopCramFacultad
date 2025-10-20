import dotenv from 'dotenv';

export function loadEnv() {
  if (!process.env._ENV_LOADED) {
    dotenv.config();
    process.env._ENV_LOADED = '1';
  }
}
