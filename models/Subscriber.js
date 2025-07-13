const mongoose_subscriber = require('mongoose');

const subscriberSchema = new mongoose_subscriber.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
});

module.exports = mongoose_subscriber.model('Subscriber', subscriberSchema);