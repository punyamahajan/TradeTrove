const mongoose = require('mongoose');


// Replace <username>, <password>, and <your-cluster-url> with your actual credentials and cluster URL
const mongoDBConnectionString = `mongodb+srv://punyamahajan23cse:mTQah4qQI6Cj0XTA@cluster0.1qier.mongodb.net/TradeTrove?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(mongoDBConnectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

