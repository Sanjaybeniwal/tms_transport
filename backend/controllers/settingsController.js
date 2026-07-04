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

// ---- Contact Page Info ----

const { Page, Setting } = require('../models');

exports.getContactInfo = async (req, res, next) => {
  try {
    const settings = await Setting.findAll();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const contactData = {
      address: settingsMap['address'] !== undefined ? settingsMap['address'] : '12, Transport Nagar, Phase-II, New Delhi - 110045',
      phone: settingsMap['phone'] !== undefined ? settingsMap['phone'] : '+91-9876543210',
      email: settingsMap['email'] !== undefined ? settingsMap['email'] : 'billing@tmsexpress.com',
      otpEmail1: settingsMap['otpEmail1'] !== undefined ? settingsMap['otpEmail1'] : 'sanjaybeniwal25@gmail.com',
      otpEmail2: settingsMap['otpEmail2'] !== undefined ? settingsMap['otpEmail2'] : 'skbeniwaljaat@gmail.com'
    };

    res.status(200).json({
      status: 'success',
      data: contactData
    });
  } catch (error) {
    next(error);
  }
};

exports.updateContactInfo = async (req, res, next) => {
  try {
    const { address, phone, email, otpEmail1, otpEmail2 } = req.body;

    if (!address && !phone && !email && !otpEmail1 && !otpEmail2) {
      return next(new AppError('Please provide at least one field to update.', 400));
    }

    if (address !== undefined) {
      await Setting.upsert({ key: 'address', value: address });
    }
    if (phone !== undefined) {
      await Setting.upsert({ key: 'phone', value: phone });
    }
    if (email !== undefined) {
      await Setting.upsert({ key: 'email', value: email });
    }
    if (otpEmail1 !== undefined) {
      await Setting.upsert({ key: 'otpEmail1', value: otpEmail1 });
    }
    if (otpEmail2 !== undefined) {
      await Setting.upsert({ key: 'otpEmail2', value: otpEmail2 });
    }

    // Also update the Contact page HTML in the database for public site
    const contactPage = await Page.findOne({ where: { slug: 'contact' } });
    if (contactPage) {
      const updatedHtml = `
            <div class="bg-gray-50 py-16 px-6">
              <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
                <div>
                  <h1 class="text-4xl font-extrabold text-gray-900 mb-4">Get In Touch</h1>
                  <p class="text-gray-600 mb-8">Have a shipment ready for Mumbai to Uttarakhand? Fill out the form or reach us via phone or email for a quick quote.</p>
                  
                  <div class="space-y-4">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">📍</div>
                      <div>
                        <h4 class="font-bold">Main Yard Depot</h4>
                        <p class="text-gray-600 text-sm">${address || ''}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">📞</div>
                      <div>
                        <h4 class="font-bold">Phone Number</h4>
                        <p class="text-gray-600 text-sm">${phone || ''}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">✉</div>
                      <div>
                        <h4 class="font-bold">Email Support</h4>
                        <p class="text-gray-600 text-sm">${email || ''}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div id="contact-form-root"></div>
                </div>
              </div>
            </div>
          `;
      contactPage.contentHtml = updatedHtml;
      await contactPage.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Contact and OTP settings updated successfully in database.'
    });
  } catch (error) {
    next(error);
  }
};
