const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  name: String,
  address: String,
  mobile: String,
  dob: Date,
  status: String,
  gender: String,
  branch: String,
  age: Number,
  consultation: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
