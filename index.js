require('dotenv').config();
const express = require('express');
const webhookRoutes = require('./routes/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/webhook', webhookRoutes);

app.get('/', (req, res) => {
  res.send('Autodelivery Bot is running ✅');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
