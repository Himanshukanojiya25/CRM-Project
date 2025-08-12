const Attendance = require('../../models/Attendance'); // correct relative path
const moment = require('moment');

const checkIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf('day');

    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: today.toDate(),
        $lte: moment(today).endOf('day').toDate(),
      },
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const attendance = existingAttendance || new Attendance({
      user: userId,
      date: today.toDate(),
    });

    attendance.checkIn = new Date();
    attendance.ipAddress = req.ip;
    attendance.deviceType = req.headers['user-agent'];

    await attendance.save();
    res.status(200).json({ message: 'Checked in successfully', data: attendance });
  } catch (error) {
    res.status(500).json({ message: 'Check-in failed', error });
  }
};

module.exports = { checkIn };
