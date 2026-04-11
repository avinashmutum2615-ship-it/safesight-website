const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const Appointment = require('./models/Appointment');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/businessAppointments', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Form POST handler
app.post('/appointment', async (req, res) => {
  try {
    const newAppointment = new Appointment(req.body);
    await newAppointment.save();
    res.send("Appointment saved successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving appointment.");
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
