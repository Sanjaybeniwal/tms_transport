const reportController = require('./backend/controllers/reportController');

// Load environment variables so DB connection works
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

const req = { query: {} };
const res = {
  statusCode: 200,
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(payload) {
    console.log("PAYLOAD:");
    console.log(JSON.stringify(payload, null, 2));
    process.exit(0);
  }
};
const next = (err) => {
  console.error("Next called with error:", err);
  process.exit(1);
};

// Connect to DB first
const { connectDB } = require('./backend/config/database');
connectDB().then(() => {
  reportController.getProfitLossReport(req, res, next);
}).catch(err => {
  console.error("DB connection error:", err);
  process.exit(1);
});
