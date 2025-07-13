const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
require('dotenv').config();

// Import Mongoose Models
const Booking = require('./models/Booking');
const Subscriber = require('./models/Subscriber');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Database Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Nodemailer Email Transporter ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// --- API ROUTES ---

// ** Contact Form Submission Route **
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, project, subject, message } = req.body;

    // 1. Save the submission to the database
    const newBooking = new Booking({ name, email, phone, project, subject, message });
    await newBooking.save();

    // 2. Render the email template with the form data
    const emailHtml = await ejs.renderFile(path.join(__dirname, 'views/contact-notification.ejs'), {
      booking: newBooking
    });

    // 3. Send the email notification
    await transporter.sendMail({
      from: `"Smoothflight Travels Website" <${process.env.EMAIL_USER}>`,
      to: process.env.WEBSITE_OWNER_EMAIL,
      subject: `New Contact Form Submission: ${subject}`,
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

    // Check if the email already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ success: false, message: 'This email is already subscribed.' });
    }

    // 1. Save the new subscriber to the database
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();
    
    // Optional: Send a notification to the website owner
    await transporter.sendMail({
        from: `"Smoothflight Travels Website" <${process.env.EMAIL_USER}>`,
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
