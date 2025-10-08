// Email Configuration with YOUR credentials
const emailConfig = {
    service: 'gmail',
    auth: {
        user: 'himanshukanojiya27@gmail.com',  // ✅ Your email
        pass: 'imvlibcvkyoatpxt'               // ✅ Your app password
    },
    // Optional: Better email delivery
    tls: {
        rejectUnauthorized: false
    }
};

module.exports = emailConfig;