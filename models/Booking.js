const mongoose_booking = require('mongoose');

const bookingSchema = new mongoose_booking.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  project: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose_booking.model('Booking', bookingSchema);