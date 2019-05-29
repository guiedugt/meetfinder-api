const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

/**
 * @api {post} /auth/login Login User
 * @apiName LoginUser
 * @apiGroup Auth
 * @apiParam {String} email User email
 * @apiParam {String} password User password
 * @apiSuccess (200) {Boolean} auth User is authenticated
 * @apiSuccess (200) {String} token User token
 * @apiError (400) {String} error Error message
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send({ error: 'Email e/ou senha inválido(s)' });
    if (!user.active) return res.status(400).send({ error: 'É preciso confirmar seu email para continuar' });

    return bcrypt.compare(password, user.password, (err, match) => {
      if (match) {
        const { JWT_SECRET, JWT_EXPIRATION } = process.env;
        const token = jwt.sign(user.toClient(), JWT_SECRET, { expiresIn: JWT_EXPIRATION });
        return res.status(200).send({ auth: true, token });
      }
      return res.status(400).send({ error: 'Email e/ou senha inválido(s)' });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @api {post} /auth/logout Logout user
 * @apiName LogoutUser
 * @apiGroup Auth
 * @apiSuccess (200) {Boolean} auth User is authenticated
 * @apiSuccess (200) {String} token User token
 */
router.post('/logout', (_req, res, next) => {
  try {
    res.status(200).send({ auth: false, token: null });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
