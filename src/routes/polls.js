const router = require('express').Router();
const mongoose = require('mongoose');

const Poll = require('../models/poll');
const User = require('../models/user');

/**
 * @api {get} /polls Get Polls
 * @apiName GetPolls
 * @apiGroup Polls
 * @apiParam (Query String) {Number} page Page number
 * @apiParam (Query String) {Number} pageSize Page size
 * @apiHeader {String} x-token Authentication token
 * @apiSuccess (200) {Poll[]} 200 Polls
 */
router.get('/', async (req, res) => {
  const { page, pageSize } = req.query;

  const limit = Number(pageSize || 10);
  const skip = Math.max(0, page - 1) * limit;
  const pagination = { limit, skip };

  const polls = await Poll.find({}, '+status', pagination).populate('owner')
    .then(pollList => pollList.map(poll => Poll(poll).toClient()));

  return res.status(200).send(polls);
});

/**
 * @api {get} /polls/mine Get My Polls
 * @apiName GetMyPolls
 * @apiGroup Polls
 * @apiParam (Query String) {Number} page Page number
 * @apiParam (Query String) {Number} pageSize Page size
 * @apiHeader {String} x-token Authentication token
 * @apiSuccess (200) {Poll[]} 200 Polls
 */
router.get('/mine', async (req, res) => {
  const { page, pageSize } = req.params;

  const owner = await User.findById(req.user.id);
  if (!owner) return res.status(500).send({ error: 'Usuário não encontrado' });

  const limit = Number(pageSize || 10);
  const skip = Math.max(0, page - 1) * limit;
  const pagination = { limit, skip };

  const polls = await Poll.find({ owner }, '+status', pagination).populate('owner')
    .then(pollList => pollList.map(poll => Poll(poll).toClient()));

  return res.status(200).send(polls);
});

/**
 * @api {post} /polls Create Poll
 * @apiName CreatePoll
 * @apiGroup Polls
 * @apiHeader {String} x-token Authentication token
 * @apiParam {String} name Poll name
 * @apiParam {Date} deadline Poll deadline
 * @apiParam {Object[]} subjects Subjects
 * @apiSuccess (201) {Poll} poll Created Poll
 * @apiError (400) {String} error Error Message
 * @apiError (500) {String} error Error Message
 */
router.post('/', async (req, res) => {
  const { deadline, name, subjects } = req.body;

  if (!deadline) return res.status(400).send({ error: 'É preciso definir uma data para o fim da votação' });
  if (!subjects || subjects.length === 0) return res.status(400).send({ error: 'Deve haver ao menos 1 tema para votação' });

  const owner = await User.findById(req.user.id);
  if (!owner) return res.status(500).send({ error: 'Usuário não encontrado' });

  const poll = new Poll({
    _id: new mongoose.Types.ObjectId(),
    deadline,
    name,
    subjects,
    owner,
  });

  return poll.save((saveError) => {
    if (saveError) return res.status(500).send({ error: saveError.message });
    return res.status(201).send(poll.toClient());
  });
});

router.get('/:id', (req, res) => {
  res.status(200).json({
    message: 'poll details',
    id: req.params.id,
  });
});

router.delete('/:id', (req, res) => {
  res.status(200).json({
    message: 'poll deleted',
    id: req.params.id,
  });
});

module.exports = router;
