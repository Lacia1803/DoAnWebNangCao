const nodemailer = require('nodemailer');
const logger = require('../config/logger');
require('dotenv').config();

// Create reusable transporter
const createTransporter = () => {
  // Disable sending emails during tests
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  // If credentials are missing, don't attempt to send real emails
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger.warn('Email credentials not configured; emails will be logged only');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      logger.info('Email would be sent', options);
      return { success: true, messageId: 'dev-mode' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Library System" <noreply@library.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { 
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.logError(error, { context: 'sendEmail', to: options.to });
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email after registration
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 Chào mừng đến với Library System!</h1>
        </div>
        <div class="content">
          <h2>Xin chào ${user.username}!</h2>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Library System. Tài khoản của bạn đã được tạo thành công!</p>
          
          <p><strong>Thông tin tài khoản:</strong></p>
          <ul>
            <li>Username: ${user.username}</li>
            <li>Email: ${user.email}</li>
            <li>Vai trò: ${user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</li>
          </ul>

          <p>Bạn có thể bắt đầu khám phá thư viện và mượn sách ngay bây giờ!</p>
          
          <a href="http://localhost:3000/login" class="button">Đăng nhập ngay</a>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>&copy; 2024 Library System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: '🎉 Chào mừng bạn đến với Library System!',
    html,
    text: `Chào mừng ${user.username}! Tài khoản của bạn đã được tạo thành công tại Library System.`
  });
};

/**
 * Send overdue book reminder
 */
const sendOverdueReminder = async (user, borrow) => {
  const daysOverdue = Math.floor((new Date() - new Date(borrow.dueDate)) / (1000 * 60 * 60 * 24));
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Nhắc nhở trả sách</h1>
        </div>
        <div class="content">
          <h2>Xin chào ${user.username}!</h2>
          
          <div class="warning">
            <strong>⏰ Sách của bạn đã quá hạn ${daysOverdue} ngày!</strong>
          </div>

          <p><strong>Thông tin sách:</strong></p>
          <ul>
            <li>Tên sách: ${borrow.book?.title || 'N/A'}</li>
            <li>Tác giả: ${borrow.book?.author || 'N/A'}</li>
            <li>Ngày mượn: ${new Date(borrow.borrowDate).toLocaleDateString('vi-VN')}</li>
            <li>Hạn trả: ${new Date(borrow.dueDate).toLocaleDateString('vi-VN')}</li>
            <li>Số ngày quá hạn: <strong>${daysOverdue} ngày</strong></li>
          </ul>

          <p>Vui lòng trả sách sớm nhất có thể để tránh các khoản phí phạt và để người khác có thể mượn sách.</p>
          
          <a href="http://localhost:3000/my-borrows" class="button">Xem sách đã mượn</a>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>&copy; 2024 Library System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `⚠️ Nhắc nhở: Sách "${borrow.book?.title}" đã quá hạn ${daysOverdue} ngày`,
    html,
    text: `Xin chào ${user.username}! Sách "${borrow.book?.title}" của bạn đã quá hạn ${daysOverdue} ngày. Vui lòng trả sách sớm.`
  });
};

/**
 * Send borrow confirmation email
 */
const sendBorrowConfirmation = async (user, borrow) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📖 Xác nhận mượn sách</h1>
        </div>
        <div class="content">
          <h2>Xin chào ${user.username}!</h2>
          <p>Bạn đã mượn sách thành công!</p>
          
          <div class="info-box">
            <h3>Thông tin mượn sách:</h3>
            <p><strong>Tên sách:</strong> ${borrow.book?.title || 'N/A'}</p>
            <p><strong>Tác giả:</strong> ${borrow.book?.author || 'N/A'}</p>
            <p><strong>Ngày mượn:</strong> ${new Date(borrow.borrowDate).toLocaleDateString('vi-VN')}</p>
            <p><strong>Hạn trả:</strong> ${new Date(borrow.dueDate).toLocaleDateString('vi-VN')}</p>
          </div>

          <p>⏰ Vui lòng trả sách trước ngày <strong>${new Date(borrow.dueDate).toLocaleDateString('vi-VN')}</strong> để tránh phí phạt.</p>
          
          <a href="http://localhost:3000/my-borrows" class="button">Xem sách đã mượn</a>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>&copy; 2024 Library System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `📖 Xác nhận mượn sách: ${borrow.book?.title}`,
    html,
    text: `Xin chào ${user.username}! Bạn đã mượn sách "${borrow.book?.title}" thành công. Hạn trả: ${new Date(borrow.dueDate).toLocaleDateString('vi-VN')}`
  });
};

/**
 * Send return confirmation email
 */
const sendReturnConfirmation = async (user, borrow) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Xác nhận trả sách</h1>
        </div>
        <div class="content">
          <h2>Xin chào ${user.username}!</h2>
          <p>Bạn đã trả sách thành công. Cảm ơn bạn đã sử dụng thư viện!</p>
          <div class="info-box">
            <h3>Thông tin trả sách:</h3>
            <p><strong>Tên sách:</strong> ${borrow.book?.title || 'N/A'}</p>
            <p><strong>Tác giả:</strong> ${borrow.book?.author || 'N/A'}</p>
            <p><strong>Ngày mượn:</strong> ${new Date(borrow.borrowDate).toLocaleDateString('vi-VN')}</p>
            <p><strong>Ngày trả:</strong> ${new Date(borrow.returnDate || new Date()).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        <div class="footer">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>&copy; 2024 Library System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: user.email,
    subject: `✅ Xác nhận trả sách: ${borrow.book?.title || ''}`,
    html,
    text: `Bạn đã trả sách ${borrow.book?.title || ''} thành công.`
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOverdueReminder,
  sendBorrowConfirmation,
  sendReturnConfirmation
};
