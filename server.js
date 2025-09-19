const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // your HTML/CSS/JS

app.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required' });
  }

  try {
    // Configure the email transport
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'yourgmail@gmail.com', // Replace with your Gmail
        pass: 'yourapppassword'       // Use an App Password (not your real password)
      }
    });

    // Send email to yourself
    await transporter.sendMail({
      from: 'yourgmail@gmail.com',
      to: 'yourgmail@gmail.com',
      subject: 'New Newsletter Subscription',
      text: `New user subscribed with email: ${email}`
    });

    // Optionally send confirmation to the subscriber
    await transporter.sendMail({
      from: 'yourgmail@gmail.com',
      to: email,
      subject: 'Subscription Confirmed',
      text: 'Thank you for subscribing to Bite Box!'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
