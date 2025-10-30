const { Borrow, User, Book } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');
const { sendOverdueReminder } = require('../utils/emailService');

async function runOverdueSweep() {
  try {
    const now = new Date();

    // 1) Đánh dấu bất kỳ bản ghi mượn nào đã quá hạn
    const [updatedCount] = await Borrow.update(
      { status: 'overdue' },
      {
        where: {
          status: 'borrowed',
          dueDate: { [Op.lt]: now }
        }
      }
    );

    // 2) Tìm các bản ghi quá hạn chưa được nhắc nhở
    const dueOverdues = await Borrow.findAll({
      where: {
        status: 'overdue',
        overdueReminderSent: false
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'author'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    let sent = 0;
    for (const borrow of dueOverdues) {
      try {
        await sendOverdueReminder(borrow.user, borrow);
        await borrow.update({ overdueReminderSent: true, lastReminderAt: new Date() });
        sent++;
      } catch (e) {
        logger.warn('Gửi nhắc nhở quá hạn thất bại', { borrowId: borrow.id, error: e.message });
      }
    }

    if (updatedCount > 0 || sent > 0) {
      logger.info('Hoàn thành quét quá hạn', { updatedCount, remindersSent: sent });
    }
  } catch (e) {
    logger.logError(e, { context: 'overdueJob' });
  }
}

function startOverdueJob() {
  const enabled = (process.env.OVERDUE_CRON_ENABLED || 'false').toLowerCase() === 'true';
  if (!enabled) {
    logger.info('Job quá hạn bị tắt (đặt OVERDUE_CRON_ENABLED=true để bật).');
    return;
  }

  const intervalMins = parseInt(process.env.OVERDUE_CHECK_MINS || '60', 10);
  const intervalMs = Math.max(5, intervalMins) * 60 * 1000; // tối thiểu 5 phút

  logger.info(`Job quá hạn đã bật. Chạy mỗi ${Math.max(5, intervalMins)} phút.`);

  // Chạy một lần khi khởi động, sau đó theo interval
  runOverdueSweep();
  setInterval(runOverdueSweep, intervalMs);
}

module.exports = { startOverdueJob };
