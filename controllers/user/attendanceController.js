const Attendance = require('../../models/Attendance');
const moment = require('moment');

// ✅ Check-In
const checkIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf('day');

    const existing = await Attendance.findOne({
      user: userId,
      date: { $gte: today.toDate(), $lte: moment(today).endOf('day').toDate() }
    });

    if (existing && existing.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    const attendance = existing || new Attendance({
      user: userId,
      date: today.toDate()
    });

    attendance.checkIn = new Date();
    attendance.ipAddress = req.ip;
    attendance.deviceType = req.headers['user-agent'];

    await attendance.save();
    res.status(200).json({ message: 'Checked in successfully', data: attendance });
  } catch (err) {
    res.status(500).json({ message: 'Check-in failed', error: err.message });
  }
};

// ✅ Check-Out
const checkOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = moment().startOf('day');

    const attendance = await Attendance.findOne({
      user: userId,
      date: { $gte: today.toDate(), $lte: moment(today).endOf('day').toDate() },
      checkOut: { $exists: false }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No valid check-in found or already checked out' });
    }

    attendance.checkOut = new Date();
    attendance.totalHours = Math.abs((attendance.checkOut - attendance.checkIn) / (1000 * 60 * 60)).toFixed(2);

    await attendance.save();

    res.status(200).json({ message: 'Checked out successfully', data: attendance });
  } catch (err) {
    res.status(500).json({ message: 'Check-out failed', error: err.message });
  }
};

// ✅ User's All Records
const myRecords = async (req, res) => {
  try {
    const userId = req.user._id;
    const records = await Attendance.find({ user: userId }).sort({ date: -1 });
    res.status(200).json({ message: 'Records fetched', data: records });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching records', error: err.message });
  }
};

module.exports = { checkIn, checkOut, myRecords };
