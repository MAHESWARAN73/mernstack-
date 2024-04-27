const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult, check } = require('express-validator');

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/mernStackDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User model
const User = mongoose.model('User', {
  name: String,
  email: String,
  mobileNumber: String,
  profilePicture: String,
  password: String,
  emailVerified: Boolean,
  mobileVerified: Boolean,
});

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password',
  },
});

// Signup endpoint
app.post(
  '/signup',
  upload.single('profilePicture'),
  [
    check('email').isEmail(),
    check('mobileNumber').isLength({ min: 10, max: 10 }).isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, mobileNumber, password } = req.body;
    const profilePicture = req.file ? req.file.path : '';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      mobileNumber,
      profilePicture,
      password: hashedPassword,
      emailVerified: false,
      mobileVerified: false,
    });

    await user.save();

    // Send email verification mail
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, upperCase: false, specialChars: false });
    const mailOptions = {
      from: 'your_email@gmail.com',
      to: email,
      subject: 'Email Verification',
      text: `Your OTP for email verification is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.status(200).json({ message: 'User registered successfully. Please verify your email.' });
  }
);

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!user.emailVerified) {
    return res.status(401).json({ message: 'Email not verified' });
  }

  // Generate JWT token for authentication
  const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });

  res.status(200).json({ token });
});

// Verify email endpoint
app.post('/verify-email', async (req, res) => {
  const { email, otp } = req.body;

  // Verify OTP (dummy logic for demonstration)
  if (otp === '123456') {
    await User.updateOne({ email }, { emailVerified: true });
    return res.status(200).json({ message: 'Email verified successfully' });
  } else {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
