// Attendance service (aapka code)
const Attendance = require('../../models/Attendance');
const moment = require('moment');

const checkIn = async (userId, ipAddr, deviceType) => {
  try {
    const today = moment().startOf('day');
    const now = new Date();

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate(),
      },
    });

    if (existingAttendance && existingAttendance.checkIn) {
      throw new Error('Already checked in today');
    }

    const attendance = existingAttendance || new Attendance({
      user: userId,
      date: today.toDate(),
    });

    attendance.checkIn = now;
    attendance.ipAddress = ipAddr;
    attendance.deviceType = deviceType;

    const checkInHour = now.getHours();
    if (checkInHour > 10) {
      attendance.status = 'late';
    }

    await attendance.save();
    return { success: true, data: attendance };
  } catch (error) {
    throw error;
  }
  console.log('Attendance service loaded');
};

module.exports = { checkIn };


// ✅ TEST BLOCK (sirf manual test ke liye)
if (require.main === module) {
  // Pehle MongoDB connection banana padega
  const mongoose = require('mongoose');

  (async () => {
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/testdb'); // apna db url daalna

      const result = await checkIn(
        '66d3f5d54a3f4c1a88b7e123', // koi valid userId daalna (MongoDB ObjectId)
        '192.168.1.10',
        'Laptop'
      );

      console.log('✅ Test Result:', result);
    } catch (err) {
      console.error('❌ Error:', err.message);
    } finally {
      mongoose.connection.close();
    }
  })();
}
