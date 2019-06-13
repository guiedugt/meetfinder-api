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
 * @apiParam (Query String) {String} status Poll status
 * @apiParam (Query String) {String} filter Poll name filter
 * @apiHeader {String} x-token Authentication token
 * @apiSuccess (200) {Poll[]} 200 Polls
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page,
      pageSize,
      status,
      filter,
    } = req.query;

    const limit = Number(pageSize || 10);
    const skip = Math.max(0, page - 1) * limit;
    const pagination = { limit, skip };

    const statusQuery = ({
      voting: { $gte: Date.now() },
      ended: { $lt: Date.now() },
    })[status];

    const query = {};
    if (status) query.deadline = statusQuery;
    if (filter) query.name = { $regex: new RegExp(filter, 'i') };

    const polls = await Poll.find(query, '+status', pagination).populate('owner').populate('subjects.voters')
      .then(pollList => pollList.map(poll => Poll(poll).toClient()));

    return res.status(200).send(polls);
  } catch (err) {
    next(err);
  }
});

/**
 * @api {get} /polls/mine Get My Polls
 * @apiName GetMyPolls
 * @apiGroup Polls
 * @apiParam (Query String) {Number} page Page number
 * @apiParam (Query String) {Number} pageSize Page size
 * @apiParam (Query String) {String} status Poll status
 * @apiParam (Query String) {String} filter Poll name filter
 * @apiHeader {String} x-token Authentication token
 * @apiSuccess (200) {Poll[]} 200 Polls
 */
router.get('/mine', async (req, res, next) => {
  try {
    const {
      page,
      pageSize,
      status,
      filter,
    } = req.query;

    const owner = await User.findById(req.user.id);
    if (!owner) return res.status(500).send({ error: 'Usuário não encontrado' });

    const limit = Number(pageSize || 10);
    const skip = Math.max(0, page - 1) * limit;
    const pagination = { limit, skip };

    const statusQuery = ({
      voting: { $gte: Date.now() },
      ended: { $lt: Date.now() },
    })[status];

    const query = { owner };
    if (status) query.deadline = statusQuery;
    if (filter) query.name = { $regex: new RegExp(filter, 'i') };

    const polls = await Poll.find(query, '+status', pagination).populate('owner').populate('subjects.voters')
      .then(pollList => pollList.map(poll => Poll(poll).toClient()));

    return res.status(200).send(polls);
  } catch (err) {
    next(err);
  }
});

/**
 * @api {post} /polls Create Poll
 * @apiName CreatePoll
 * @apiGroup Polls
 * @apiHeader {String} x-token Authentication token
 * @apiParam {String} name Poll name
 * @apiParam {Date} deadline Poll deadline
 * @apiParam {String[]} subjects Subjects
 * @apiSuccess (201) {Poll} poll Created Poll
 * @apiError (400) {String} error Error Message
 * @apiError (500) {String} error Error Message
 */
router.post('/', async (req, res, next) => {
  try {
    const { deadline, name, subjects } = req.body;

    if (!deadline) return res.status(400).send({ error: 'É preciso definir uma data para o fim da votação' });
    if (new Date(deadline).toString() === 'Invalid Date') return res.status(400).send({ error: 'Data do fim da votação inválida' });
    if (new Date(deadline) < Date.now()) return res.status(400).send({ error: 'Data do fim da votação deve ser no futuro' });
    if (!name) return res.status(400).send({ error: 'É preciso definir um nome para a enquete' });
    if (!subjects || subjects.length === 0) return res.status(400).send({ error: 'Deve haver ao menos 1 tema para votação' });

    const owner = await User.findById(req.user.id);
    if (!owner) return res.status(500).send({ error: 'Usuário não encontrado' });

    const poll = new Poll({
      _id: new mongoose.Types.ObjectId(),
      subjects: subjects.map(s => ({ name: s, voters: [] })),
      deadline,
      name,
      owner,
    });

    return poll.save((saveError) => {
      if (saveError) return res.status(500).send({ error: saveError.message });
      return res.status(201).send(poll.toClient());
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @api {get} /polls/:id Find Poll
 * @apiName FindPoll
 * @apiGroup Polls
 * @apiParam {String} id Poll id
 * @apiSuccess (200) {Poll} Poll Poll
 * @apiError (400) {String} error Error Message
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id).populate('owner').populate('subjects.voters');
    if (!poll) return res.status(400).send({ error: 'Enquete não encontrada' });

    return res.status(200).send(poll.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * @api {delete} /polls/:id Delete Poll
 * @apiName DeletePoll
 * @apiGroup Polls
 * @apiParam (Param) {String} id Poll id
 * @apiSuccess (204) 204 No Content
 * @apiError (400) {String} error Error message
 * @apiError (500) {String} error Error message
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id);
    if (!poll) return res.status(400).send({ error: 'Enquete não encontrada' });

    return poll.delete((deleteError) => {
      if (deleteError) return res.status(500).send({ error: deleteError.message });
      return res.status(204).send();
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @api {post} /:id/vote Vote Poll
 * @apiName Vote Poll
 * @apiGroup Polls
 * @apiHeader {String} x-token Authentication token
 * @apiParam (Param) {String} id Poll id
 * @apiParam {String} name Subject name
 * @apiSuccess (200) {Poll} Poll Updated Poll
 * @apiError (400) {String} error Error message
 * @apiError (500) {String} error Error message
*/
router.post('/:id/vote', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(500).send({ error: 'Usuário não encontrado' });

    const poll = await Poll.findById(id).populate('owner').populate('subjects.voters');
    if (!poll) return res.status(400).send({ error: 'Enquete não encontrada' });
    if (poll.status !== 'voting') return res.status(400).send({ error: 'Enquete não está em votação' });

    const subject = poll.subjects.find(s => s.name === name);
    if (!subject) return res.status(400).send({ error: 'Tema não encontrado' });

    const votedSubject = poll.subjects.find(s => s.voters.find(v => v.id === req.user.id));
    if (votedSubject) {
      const voterIndex = votedSubject.voters.findIndex(v => v.id === req.user.id);
      const votedSubjectIndex = poll.subjects.findIndex(s => s.id === votedSubject.id);

      votedSubject.voters.splice(voterIndex, 1);
      poll.subjects[votedSubjectIndex] = votedSubject;
    }

    if (votedSubject && votedSubject.name === name) {
      await poll.save();
      return res.status(200).send(poll.toClient());
    }

    poll.subjects.find(s => s.name === name).voters.push(user);

    await poll.save();
    return res.status(200).send(poll.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * @api {put} /polls/:id Update Poll
 * @apiName UpdatePoll
 * @apiGroup Polls
 * @apiParam (Param) {String} id Poll id
 * @apiHeader {String} x-token Authentication token
 * @apiParam {Date} deadline Poll deadline
 * @apiParam {String} name Poll name
 * @apiParam {String[]} subjects Poll subjects
 * @apiSuccess (200) {Poll} Poll Updated poll
 * @apiError (400) {String} error Error message
 * @apiError (500) {String} error Error message
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deadline, name, subjects } = req.body;

    if (deadline) {
      if (new Date(deadline).toString() === 'Invalid Date') return res.status(400).send({ error: 'Data do fim da votação inválida' });
      if (new Date(deadline) < Date.now()) return res.status(400).send({ error: 'Data do fim da votação deve ser no futuro' });
    }

    if (subjects && subjects.length === 0) return res.status(400).send({ error: 'Deve haver ao menos 1 tema para votação' });

    const poll = await Poll.findById(id).populate('owner');
    if (!poll) return res.status(400).send({ error: 'Enquete não encontrada' });

    const owner = await User.findById(req.user.id);

    if (!owner) return res.status(500).send({ error: 'Usuário não encontrado' });
    if (owner.id !== req.user.id) return res.status(400).send({ error: 'Você não é o dono dessa enquete' });

    if (deadline) poll.deadline = deadline;
    if (name) poll.name = name;
    if (subjects && subjects.length) poll.subjects = subjects.map(s => ({ name: s, voters: [] }));

    await poll.save();
    return res.status(200).send(poll.toClient());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
