const router = require('express').Router();
const Log = require('../models/Log');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|wav|mp3|txt|log/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Email transporter configuration
// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};


// ===== LOG ENDPOINTS =====

// Get all logs with filters
router.get('/logs', async (req, res) => {
  try {
    const { type, deviceId, startDate, endDate, limit = 100 } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (deviceId) query.deviceId = deviceId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
      
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new log
router.post('/logs', async (req, res) => {
  try {
    const log = new Log(req.body);
    await log.save();
    
    // Check if alert needed
    if (req.body.severity === 'high' || req.body.severity === 'critical') {
      await sendAlertEmail(req.body);
    }
    
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Upload log with file (screenshot, audio, etc.)
router.post('/logs/upload', upload.single('file'), async (req, res) => {
  try {
    const logData = {
      ...JSON.parse(req.body.data),
      data: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : req.body.data
    };
    
    const log = new Log(logData);
    await log.save();
    
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mark log as read
router.patch('/logs/:id/read', async (req, res) => {
  try {
    const log = await Log.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete log
router.delete('/logs/:id', async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ===== STATS ENDPOINTS =====

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const [totalLogs, todayLogs, weekLogs, devices, logTypes, unreadAlerts] = await Promise.all([
      Log.countDocuments(),
      Log.countDocuments({ timestamp: { $gte: today } }),
      Log.countDocuments({ timestamp: { $gte: thisWeek } }),
      Log.distinct('deviceId'),
      Log.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Log.countDocuments({ type: 'alert', isRead: false })
    ]);
    
    res.json({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        weekLogs,
        activeDevices: devices.length,
        logTypes: logTypes.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        unreadAlerts,
        lastUpdate: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get activity timeline
router.get('/stats/timeline', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const timeline = await Log.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 },
          types: { $addToSet: '$type' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ success: true, data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ALERT ENDPOINTS =====

// Send custom alert
router.post('/alerts/send', async (req, res) => {
  try {
    const { to, subject, message, priority = 'medium' } = req.body;
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `Cyber Monitor <${process.env.EMAIL_USER}>`,
      to: to || process.env.ALERT_EMAIL,
      subject: `[${priority.toUpperCase()}] ${subject || 'Cyber Monitor Alert'}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
              <h1 style="margin: 0;">🔔 Cyber Monitor Alert</h1>
            </div>
            <div style="padding: 20px;">
              <h2 style="color: #333;">Priority: ${priority.toUpperCase()}</h2>
              <p style="color: #666; line-height: 1.6;">${message}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                Timestamp: ${new Date().toLocaleString()}<br>
                This is an automated alert from Cyber Monitor System
              </p>
            </div>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    // Save alert to database
    const alertLog = new Log({
      type: 'alert',
      data: { subject, message, to, priority },
      deviceId: 'system',
      severity: priority,
      metadata: new Map([['sentAt', new Date().toISOString()]])
    });
    await alertLog.save();
    
    res.json({ success: true, message: 'Alert sent successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test email configuration
router.post('/alerts/test', async (req, res) => {
  try {
    const transporter = createTransporter();
    
    await transporter.verify();
    
    const testMail = {
      from: process.env.EMAIL_USER,
      to: req.body.email || process.env.ALERT_EMAIL,
      subject: 'Test Alert - Cyber Monitor',
      text: 'If you receive this email, your email configuration is working correctly!'
    };
    
    await transporter.sendMail(testMail);
    res.json({ success: true, message: 'Test email sent!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SETTINGS ENDPOINTS =====

// Get settings
router.get('/settings', async (req, res) => {
  res.json({
    success: true,
    data: {
      emailConfigured: !!process.env.EMAIL_USER,
      alertEmail: process.env.ALERT_EMAIL,
      serverTime: new Date(),
      version: '1.0.0'
    }
  });
});

// Update settings
router.post('/settings/update', async (req, res) => {
  try {
    // In production, save to database
    const { alertEmail, alertThreshold } = req.body;
    
    // Update environment variables (in real app, save to DB)
    if (alertEmail) process.env.ALERT_EMAIL = alertEmail;
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Helper function to send alert emails
async function sendAlertEmail(logData) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: `⚠️ High Priority Alert - ${logData.type}`,
      html: `
        <h2>Security Alert</h2>
        <p><strong>Type:</strong> ${logData.type}</p>
        <p><strong>Device:</strong> ${logData.deviceId}</p>
        <p><strong>Severity:</strong> ${logData.severity}</p>
        <p><strong>Data:</strong> ${JSON.stringify(logData.data)}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send alert email:', error);
  }
}

module.exports = router;
