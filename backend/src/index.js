// Standalone server entrypoint — used locally (npm run dev) and on Node hosts
// like Render/Railway/Fly (npm start). On Vercel the app is served via
// backend/api/index.js as a serverless function instead.
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Movielly backend running on port ${PORT}`);
});
