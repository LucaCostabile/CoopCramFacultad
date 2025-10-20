import app from './app.js';
import { loadEnv } from './config/env.js';

loadEnv();

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
});
