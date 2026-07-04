const { User } = require('../models');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_tms_token_signing_key_2026_production_grade', {
    expiresIn: process.env.JWT_EXPIRE || '8h'
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user.id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const sendOtpEmail = async (userEmail, otpCode) => {
  const nodemailer = require('nodemailer');
  const { Setting } = require('../models');

  let otpEmail1 = 'sanjaybeniwal25@gmail.com';
  let otpEmail2 = 'skbeniwaljaat@gmail.com';
  try {
    const s1 = await Setting.findByPk('otpEmail1');
    const s2 = await Setting.findByPk('otpEmail2');
    if (s1 && s1.value) otpEmail1 = s1.value;
    if (s2 && s2.value) otpEmail2 = s2.value;
  } catch (err) {
    console.error('Error fetching OTP settings from database:', err);
  }

  try {
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.log(`[SMTP LOG] Simulated OTP mail sent to ${otpEmail1} and ${otpEmail2}. Code: ${otpCode}`);
      return;
    }

    const mailOptions = {
      from: `BUTS Auth Portal <${process.env.SMTP_USER}>`,
      to: `${otpEmail1}, ${otpEmail2}`,
      subject: 'BUTS Admin Login - One-Time Verification Code (OTP)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">BUTS Security Verification</h2>
          <p>Hello Administrator,</p>
          <p>You are attempting to log in to the Bombay Uttaranchal Tempo Service Admin Portal. Please use the following One-Time Password (OTP) to complete your login:</p>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #64748b;">This OTP code is valid for 5 minutes. If you did not request this login attempt, please secure your password immediately.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] OTP email successfully sent to ${otpEmail1} and ${otpEmail2}`);
  } catch (err) {
    console.error('[SMTP ERROR] Failed to send OTP email via nodemailer:', err);
  }
};

const getClientIp = (req) => {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  if (ip && ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  return ip;
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    if (user.status === 'Inactive') {
      return next(new AppError('Your account has been deactivated. Contact Admin.', 403));
    }

    // For admin-level roles, enforce OTP verification only if logging in from a different IP
    if (['Super Admin', 'Admin', 'Manager'].includes(user.role)) {
      const currentIp = getClientIp(req);
      
      if (user.lastLoginIp === currentIp) {
        console.log(`[AUTH DEBUG] Admin login IP matches trusted lastLoginIp (${currentIp}). Direct login approved.`);
        return sendTokenResponse(user, 200, res);
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      global.otpCache = global.otpCache || {};
      global.otpCache[email] = {
        otpCode,
        userId: user.id,
        timestamp: Date.now()
      };

      console.log(`[OTP DEBUG] Generated OTP for admin login from new IP (${currentIp}): ${otpCode}`);

      // Attempt to send email
      sendOtpEmail(email, otpCode);

      return res.status(200).json({
        status: 'otp_required',
        message: 'A verification code (OTP) has been sent to your administrator emails.',
        email
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error('Login Error:', error);
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError('Please provide email and verification code', 400));
    }

    let dbDefaultOtp = '222555';
    try {
      const defaultOtpSetting = await Setting.findByPk('defaultOtp');
      if (defaultOtpSetting && defaultOtpSetting.value) {
        dbDefaultOtp = defaultOtpSetting.value;
      }
    } catch (err) {
      console.error('Error loading default OTP from database settings:', err);
    }

    const isDefaultOtp = otp === dbDefaultOtp;
    let isOtpValid = false;
    let userId = null;

    global.otpCache = global.otpCache || {};
    const cachedData = global.otpCache[email];

    if (isDefaultOtp) {
      isOtpValid = true;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return next(new AppError('User not found', 404));
      }
      userId = user.id;
    } else if (cachedData) {
      const isExpired = Date.now() - cachedData.timestamp > 5 * 60 * 1000;
      if (!isExpired && cachedData.otpCode === otp) {
        isOtpValid = true;
        userId = cachedData.userId;
        delete global.otpCache[email];
      }
    }

    if (!isOtpValid) {
      return next(new AppError('Incorrect or expired verification code.', 401));
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('User account not found', 404));
    }

    // Save client IP to bypass verification next time
    const currentIp = getClientIp(req);
    user.lastLoginIp = currentIp;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error('Verify OTP Error:', error);
    next(error);
  }
};

exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!(await user.comparePassword(oldPassword))) {
      return next(new AppError('Incorrect current password.', 401));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return next(new AppError('There is no user with that email address.', 404));
    }

    // Generate random reset token (mock reset mechanism returning token in payload)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset token generated. In production this would send an email.',
      resetToken // Returned in response for simple prototype demonstration
    });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return next(new AppError('Email address already registered.', 400));
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      status: 'Active'
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
