const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ejs = require('ejs');
const path = require('path');
const { Resend } = require('resend');
require('dotenv').config();

// Import Mongoose Models
const Booking = require('./models/Booking'); 
const Subscriber = require('./models/Subscriber');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Resend with your API key from the .env file
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully...'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.error(err);
  });

// --- API ROUTES ---

// ** Contact Form Submission Route **
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const newBooking = new Booking({ name, email, phone, subject, message });
    await newBooking.save();

    // Render the EJS template to get the HTML for the email
    const emailHtml = await ejs.renderFile(path.join(__dirname, 'views/contact-notification.ejs'), {
      booking: newBooking
    });

    // Send the email using Resend
    await resend.emails.send({
      from: 'Smoothflight Travels <onboarding@resend.dev>', // Use a verified Resend domain/email
      to: process.env.WEBSITE_OWNER_EMAIL,
      subject: `New Message: ${subject}`,
      html: emailHtml,
    });

    res.status(201).json({ success: true, message: 'Your message has been sent successfully!' });

  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
});


// ** Newsletter Signup Route **
app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();
    
    // Send the newsletter notification using Resend
    await resend.emails.send({
        from: 'Smoothflight Travels <onboarding@resend.dev>', // Use a verified Resend domain/email
        to: process.env.WEBSITE_OWNER_EMAIL,
        subject: 'New Newsletter Subscriber!',
        text: `A new user has subscribed to your newsletter: ${email}`,
    });

    res.status(201).json({ success: true, message: 'Thank you for subscribing!' });

  } catch (error) {
    console.error('Error processing newsletter signup:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again.' });
  }
});


// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
