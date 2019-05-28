const nodemailer = require('nodemailer');

const mail = ({ to, subject, text }, callback) => {
  const {
    MAILING_SERVICE,
    MAILING_USER,
    MAILING_PASSWORD,
  } = process.env;

  const smtp = nodemailer.createTransport({
    service: MAILING_SERVICE,
    auth: {
      user: MAILING_USER,
      pass: MAILING_PASSWORD,
    },
  });

  const options = {
    from: MAILING_USER,
    to,
    subject,
    text,
  };

  return smtp.sendMail(options, callback);
};

module.exports = mail;
