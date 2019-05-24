const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const foundUser = await User.findOne({ email });
  if (!foundUser) return res.status(400).send({ error: 'Email e/ou senha inválido(s)' });

  return bcrypt.compare(password, foundUser.password, (err, match) => {
    if (match) {
      const { JWT_SECRET, JWT_EXPIRATION } = process.env;
      const token = jwt.sign(foundUser.toClient(), JWT_SECRET, { expiresIn: JWT_EXPIRATION });
      res.status(200).send({ auth: true, token });
    } else {
      return res.status(400).send({ error: 'Email e/ou senha inválido(s)' });
    }
  });
});

/**
 * @api {post} /auth/logout Logout user
 * @apiName LogoutUser
 * @apiGroup Auth
 * @apiSuccess (200) {Boolean} auth User is authenticated
 * @apiSuccess (200) {String} token User token
 */
router.post('/logout', (_req, res) => {
  res.status(200).send({ auth: false, token: null });
});

/**
 * @api {post} /auth/register Register user
 * @apiName RegisterUser
 * @apiGroup Auth
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

  return bcrypt.hash(password, 10, (hashError, hash) => {
    if (hashError) return res.status(400).send({ error: hashError.message });

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
});

module.exports = router;
