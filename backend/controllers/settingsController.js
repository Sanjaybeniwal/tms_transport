const fs = require('fs');
const path = require('path');
const AppError = require('../utils/appError');

exports.uploadLogo = async (req, res, next) => {
  try {
    const { logo } = req.body; // base64 string
    if (!logo) {
      return next(new AppError('No logo data provided', 400));
    }

    // Extract base64 data
    const matches = logo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return next(new AppError('Invalid image data format. Please upload a valid PNG, JPG, or JPEG.', 400));
    }

    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Define paths to write the logo
    const publicPath = path.join(__dirname, '../../frontend/public/logo.png');
    const distPath = path.join(__dirname, '../../frontend/dist/logo.png');

    // Create frontend/public directory if it doesn't exist (safety fallback)
    const publicDir = path.join(__dirname, '../../frontend/public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to frontend/public/logo.png
    fs.writeFileSync(publicPath, imageBuffer);

    // Write to frontend/dist/logo.png if dist directory exists
    const distDir = path.join(__dirname, '../../frontend/dist');
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(distPath, imageBuffer);
    }

    res.status(200).json({
      status: 'success',
      message: 'Logo updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
