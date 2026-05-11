// server.js = engine start
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

connectDB();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Missing ENV variables");
  process.exit(1);
}
const PORT = process.env.PORT || 1502;

app.listen(PORT, () => {
  console.log(`Server running on port http:localhost:${PORT}`);
});