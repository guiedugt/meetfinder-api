const router = require('express').Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/user');

const jwt = require('../middleware/jwt');
const mail = require('../utils/mail');

/**
 * @api {post} /users/register Register user
 * @apiName RequestRegisterUser
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
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { REGISTER_TOKEN_EXPIRATION, UI_HOST } = process.env;

    const foundUser = await User.findOne({ email });
    if (foundUser) return res.status(409).send({ error: 'Já existe um usuário com esse email' });

    if (password.length < 6) return res.status(400).send({ error: 'Senha deve ter ao menos 6 dígitos ' });

    const hash = await bcrypt.hash(password, 10);

    const buffer = await crypto.randomBytes(20);
    const token = buffer.toString('hex');

    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      active: false,
      name,
      email,
      password: hash,
      confirmEmailToken: token,
      confirmEmailExpiration: Date.now() + REGISTER_TOKEN_EXPIRATION,
    });

    return user.save(async (saveError) => {
      if (saveError) return res.status(500).send({ error: saveError.message });

      const link = `${UI_HOST}/register/${token}`;

      const config = {
        to: user.email,
        subject: 'MeetFinder - Confirmação de Email',
        text: `Olá! Você está recebendo esse e-mail porque você (ou outra pessoa) cadastrou esse email no MeetFinder.\nPara continuar clique no link a seguir ou cole-o na sua barra de navegação.\n\n${link}\n\nCaso você não tenha feito o cadastro, por favor ignore esse email e o usuário não será criado.`,
      };

      return mail(config, (emailError) => {
        if (emailError) return res.status(500).send({ error: emailError.message });
        return res.status(204).send();
      });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @api {post} /register/resend  Resend Confirm Email
 * @apiName ResendConfirmEmail
 * @apiGroup Users
 * @apiParam {String} email Registered email
 * @apiSuccess (204) 204 No Content
 * @apiError (400) {String} error Error Message
 */
router.post('/register/resend', async (req, res, next) => {
  try {
    const { email } = req.body;
    const { REGISTER_TOKEN_EXPIRATION, UI_HOST } = process.env;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send({ error: 'Email não cadastrado' });
    if (user.active) return res.status(400).send({ error: 'Usuário já está ativo' });

    const buffer = await crypto.randomBytes(20);
    const token = buffer.toString('hex');

    user.confirmEmailToken = token;
    user.confirmEmailExpiration = Date.now() + REGISTER_TOKEN_EXPIRATION;

    return user.save((saveError) => {
      if (saveError) return res.status(500).send({ error: saveError.message });

      const link = `${UI_HOST}/register/${token}`;

      const config = {
        to: user.email,
        subject: 'MeetFinder - Confirmação de Email',
        text: `Olá! Você está recebendo esse e-mail porque você (ou outra pessoa) cadastrou esse email no MeetFinder.\nPara continuar clique no link a seguir ou cole-o na sua barra de navegação.\n\n${link}\n\nCaso você não tenha feito o cadastro, por favor ignore esse email e o usuário não será criado.`,
      };

      return mail(config, (emailError) => {
        if (emailError) return res.status(500).send({ error: emailError.message });
        return res.status(204).send();
      });
    });
  } catch (err) {
    next(err);
  }
});


/**
 * @api {post} /register/:token Confirm Email
 * @apiName ConfirmEmail
 * @apiGroup Users
 * @apiParam {String} token Confirm email token got from e mail
 * @apiSuccess (204) 204 No Content
 * @apiError (400) {String} error Error Message
 */
router.post('/register/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      confirmEmailToken: token,
      confirmEmailExpiration: { $gt: Date.now() },
    });

    if (!user) return res.status(400).send({ error: 'Link inválido ou expirado' });

    user.active = true;

    return user.save((saveError) => {
      if (saveError) return res.status(400).send({ error: saveError.message });
      return res.status(204).send();
    });
  } catch (err) {
    next(err);
  }
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
router.post('/password-recovery', async (req, res, next) => {
  try {
    const { email } = req.body;
    const { RESET_PASSWORD_TOKEN_EXPIRATION, UI_HOST } = process.env;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send({ error: 'Email não encontrado' });

    const buffer = await crypto.randomBytes(20);
    const token = buffer.toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpiration = Date.now() + RESET_PASSWORD_TOKEN_EXPIRATION;

    return user.save((saveError) => {
      if (saveError) return res.status(500).send({ error: saveError.message });

      const link = `${UI_HOST}/password-recovery/${token}`;

      const config = {
        to: user.email,
        subject: 'MeetFinder - Recuperação de Senha',
        text: `Olá! Você está recebendo esse e-mail porque você (ou outra pessoa) solicitou a recuperação de senha no MeetFinder.\nPara continuar clique no link a seguir ou cole-o na sua barra de navegação.\n\n${link}\n\nCaso você não tenha solicitado a recuperação de senha, por favor ignore esse email e sua senha não será modificada.`,
      };

      return mail(config, (emailError) => {
        if (emailError) return res.status(500).send({ error: emailError.message });
        return res.status(204).send();
      });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @api {post} /password-recovery/:token Password Recovery
 * @apiName PasswordRecovery
 * @apiGroup Users
 * @apiParam {String} token Password recovery token got from e mail
 * @apiParam {String} password New password
 * @apiSuccess (204) 204 No Content
 * @apiError (400) {String} error Error Message
 */
router.post('/password-recovery/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiration: { $gt: Date.now() },
    });

    if (!user) return res.status(400).send({ error: 'Link inválido ou expirado' });

    if (password.length < 6) return res.status(400).send({ error: 'Senha deve ter ao menos 6 dígitos ' });

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiration = undefined;

    return user.save((saveError) => {
      if (saveError) return res.status(400).send({ error: saveError.message });
      return res.status(204).send();
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @api {post} /users/change-password Change User Password
 * @apiName ChangePassword
 * @apiGroup Users
 * @apiHeader {String} x-token Authentication token
 * @apiParam {String} password New Password
 * @apiSuccess (204) 204 No Content
 * @apiError (500) {String} error Error Message
 */
router.post('/change-password', jwt, async (req, res, next) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(500).send({ error: 'Usuário não encontrado' });

    if (password.length < 6) return res.status(400).send({ error: 'Senha deve ter ao menos 6 dígitos ' });

    const hash = await bcrypt.hash(password, 10);
    user.password = hash;

    return user.save((saveError) => {
      if (saveError) return res.status(500).send({ error: saveError.message });
      return res.status(204).send();
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
