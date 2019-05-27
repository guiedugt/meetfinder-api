const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const User = require('../models/user');

/**
 * @api {post} /users/register Register user
 * @apiName RegisterUser
 * @apiGroup Users
 * @apiParam {String} name User name
 * @apiParam {String} email User email
 * @apiParam {String} password User password
 * @apiSuccess (201) {String} id User id
 * @apiSuccess (201) {String} name User name
 * @apiSuccess (201) {String} email User email
 * @apiSuccess (201) {String} password User password
 * @apiError (400) {String} error Error message
 * @apiError (409) {String} error Error message
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const foundUser = await User.findOne({ email });
  if (foundUser) return res.status(409).send({ error: 'Já existe um usuário com esse email' });

  const hash = await bcrypt.hash(password, 10);

  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name,
    email,
    password: hash,
  });

  return user.save((saveError) => {
    if (saveError) return res.status(400).send({ error: saveError.message });
    return res.status(201).send(user.toClient());
  });
});

/**
 * @api {post} /users/password-recovery Request Password Recovery
 * @apiName RequestPasswordRecovery
 * @apiGroup Users
 * @apiParam {String} email User email
 * @apiSuccess (204) 204 No Content
 * @apiError (400) {String} Error message
 * @apiError (500) {String} Error message
 */
router.post('/password-recovery', async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send(400).send({ error: 'Email inválido' });

  const buffer = await crypto.randomBytes(20);
  const token = buffer.toString('hex');

  user.resetPasswordToken = token;
  user.resetPasswordExpiration = Date.now() + process.env.RESET_PASSWORD_EXPIRATION;

  return user.save((saveError) => {
    if (saveError) return res.status(500).send({ error: saveError.message });

    const {
      MAILING_SERVICE,
      MAILING_USER,
      MAILING_PASSWORD,
      UI_HOST,
    } = process.env;

    const smtp = nodemailer.createTransport({
      service: MAILING_SERVICE,
      auth: {
        user: MAILING_USER,
        pass: MAILING_PASSWORD,
      },
    });

    const options = {
      to: user.email,
      from: MAILING_USER,
      subject: 'MeetFinder - Recuperação de Senha',
      text: `Olá! Você está recebendo esse e-mail porque você (ou outra pessoa) solicitou a recuperação de senha no MeetFinder.
            Para continuar clique no link a seguir ou cole-o na sua barra de navegação.
            ${`${UI_HOST}/password-recovery/${token}`}
            Caso você não tenha solicitado a recuperação de senha, por favor ignore esse email e sua senha não será modificada.`,
    };

    return smtp.sendMail(options, (emailError) => {
      if (emailError) return res.status(500).send({ error: emailError.message });
      return res.status(204).send();
    });
  });
});

/**
 * @api {post} /password-recovery/:token Password Recovery
 * @apiName PasswordRecovery
 * @apiGroup Users
 * @apiParam {String} token Password Recovery Token got from e mail
 * @apiSuccess (204) 204 No Content
 * @apiError (400) {String} error Error Message
 */
router.post('/password-recovery/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiration: { $gt: Date.now() },
  });

  if (!user) return res.status(400).send({ error: 'Link inválido ou expirado' });

  const hash = await bcrypt.hash(password, 10);
  user.password = hash;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiration = undefined;

  return user.save((saveError) => {
    if (saveError) return res.status(400).send({ error: saveError.message });
    return res.status(204).send();
  });
});


module.exports = router;
