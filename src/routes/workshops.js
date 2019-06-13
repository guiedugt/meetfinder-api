const router = require('express').Router();
const mongoose = require('mongoose');

const Workshop = require('../models/workshop');
const Poll = require('../models/poll');
const User = require('../models/user');

const mail = require('../utils/mail');

/**
 * @api {get} /workshops Get Workshops
 * @apiName GetWorkshops
 * @apiGroup Workshops
 * @apiParam (Query String) {Number} page Page number
 * @apiParam (Query String) {Number} pageSize Page size
 * @apiParam (Query String) {String} status Workshop status
 * @apiParam (Query String) {String} filter Workshop name filter
 * @apiHeader {String} x-token Authentication token
 * @apiSuccess (200) {Workshop[]} 200 Workshops
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
      scheduled: { $gte: Date.now() },
      ended: { $lt: Date.now() },
    })[status];

    const query = {};
    if (status) query.date = statusQuery;
    if (filter) query.name = { $regex: new RegExp(filter, 'i') };

    const workshops = await Workshop.find(query, '+status', pagination).populate('owner').populate('poll')
      .then(workshopList => workshopList.map(workshop => Workshop(workshop).toClient()));

    return res.status(200).send(workshops);
  } catch (err) {
    next(err);
  }
});

/**
 * @api {get} /workshops/mine Get My Workshops
 * @apiName GetMyWorkshops
 * @apiGroup Workshops
 * @apiParam (Query String) {Number} page Page number
 * @apiParam (Query String) {Number} pageSize Page size
 * @apiParam (Query String) {String} status Workshop status
 * @apiParam (Query String) {String} filter Workshop name filter
 * @apiHeader {String} x-token Authentication token
 * @apiSuccess (200) {Workshop[]} 200 Workshops
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
      scheduled: { $gte: Date.now() },
      ended: { $lt: Date.now() },
    })[status];

    const query = { owner };
    if (status) query.date = statusQuery;
    if (filter) query.name = { $regex: new RegExp(filter, 'i') };

    const workshops = await Workshop.find(query, '+status', pagination).populate('owner').populate('poll')
      .then(workshopList => workshopList.map(workshop => Workshop(workshop).toClient()));

    return res.status(200).send(workshops);
  } catch (err) {
    next(err);
  }
});

/**
 * @api {post} /workshops Create Workshop
 * @apiName CreateWorkshop
 * @apiGroup Workshops
 * @apiHeader {String} x-token Authentication token
 * @apiParam {Date} date Workshop date
 * @apiParam {String} pollId poll id
 * @apiSuccess (201) {Workshop} Workshop Created Workshop
 * @apiError (400) {String} error Error Message
 * @apiError (500) {String} error Error Message
 */
router.post('/', async (req, res, next) => {
  try {
    const { date, pollId } = req.body;
    const { ROOM_BASE_URL } = process.env;

    if (!date) return res.status(400).send({ error: 'É preciso definir uma data para o workshop' });
    if (new Date(date).toString() === 'Invalid Date') return res.status(400).send({ error: 'Data inválida' });
    if (new Date(date) < Date.now()) return res.status(400).send({ error: 'Data deve ser no futuro' });
    if (!pollId) return res.status(400).send({ error: 'É preciso definir a qual enquete esse workshop se refere' });

    const owner = await User.findById(req.user.id);
    if (!owner) return res.status(500).send({ error: 'Usuário não encontrado' });

    const poll = await Poll.findById(pollId).populate('owner').populate('subjects.voters');
    if (!poll) return res.status(400).send({ error: 'Enquete não encontrada ' });
    if (poll.status !== 'ended') return res.status(400).send({ error: 'Enquete ainda não terminou' });

    const foundWorkshop = await Workshop.findOne({ poll: poll.id });
    if (foundWorkshop) return res.status(400).send({ error: 'Já há um workshop para essa enquete' });

    const mostVotedSubject = poll.subjects.sort((a, b) => (a.voters.length < b.voters.length ? 1 : -1))[0];
    const room = `${ROOM_BASE_URL}/${poll.id}`;

    const workshop = new Workshop({
      _id: new mongoose.Types.ObjectId(),
      subject: mostVotedSubject.name,
      name: poll.name,
      room,
      date,
      owner,
      poll,
    });

    await workshop.save();

    await Poll.findOneAndUpdate({ _id: poll.id }, { workshop });

    const voters = poll.subjects.reduce((acc, cur) => [...acc, ...cur.voters], []);

    voters.forEach((voter) => {
      const config = {
        to: voter.email,
        subject: `MeetFinder - Workshop - ${workshop.subject}`,
        text: `Olá! Foi agendado um workshop para uma enquete da qual você participou.\nAnote as informações do workshop e não perca!\n\n${workshop.name}\nAssunto: ${workshop.subject}\nData: ${new Date(workshop.date).toLocaleString('pt-BR')}\nOrganizador: ${workshop.owner.name}\nSala: ${workshop.room}`,
      };

      mail(config);
    });

    return res.status(201).send(workshop.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * @api {get} /workshops/:id Find Workshop
 * @apiName FindWorkshop
 * @apiGroup Workshops
 * @apiParam {String} id Workshop id
 * @apiSuccess (200) {Workshop} Workshop Workshop
 * @apiError (400) {String} error Error Message
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id).populate('owner');
    if (!workshop) return res.status(400).send({ error: 'Workshop não encontrado' });

    return res.status(200).send(workshop.toClient());
  } catch (err) {
    next(err);
  }
});

/**
 * @api {delete} /workshops/:id Delete Workshop
 * @apiName DeleteWorkshop
 * @apiGroup Workshops
 * @apiParam (Param) {String} id Workshop id
 * @apiSuccess (204) 204 No Content
 * @apiError (400) {String} error Error message
 * @apiError (500) {String} error Error message
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const workshop = await Workshop.findById(id)
      .populate('owner')
      .populate({
        path: 'poll',
        populate: { path: 'subjects.voters' },
      });

    if (!workshop) return res.status(400).send({ error: 'Workshop não encontrado' });

    await workshop.delete();

    const voters = workshop.poll.subjects.reduce((acc, cur) => [...acc, ...cur.voters], []);

    voters.forEach((voter) => {
      const config = {
        to: voter.email,
        subject: `MeetFinder - Workshop - ${workshop.subject} (Cancelamento)`,
        text: `Olá! Infelizmente o seguinte workshop de uma enquete da qual você participou foi cancelado.\n\n${workshop.name}\nAssunto: ${workshop.subject}\nData: ${new Date(workshop.date).toLocaleString('pt-BR')}\nOrganizador: ${workshop.owner.name}\nSala: ${workshop.room}`,
      };

      mail(config);
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * @api {put} /workshops/:id Update Workshop
 * @apiName UpdateWorkshop
 * @apiGroup Workshops
 * @apiParam (Param) {String} id Workshop id
 * @apiHeader {String} x-token Authentication token
 * @apiParam {String} name Workshop name
 * @apiParam {Date} date Workshop date
 * @apiSuccess (201) {Workshop} Workshop Updated Workshop
 * @apiError (400) {String} error Error Message
 * @apiError (500) {String} error Error Message
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (date) {
      if (new Date(date).toString() === 'Invalid Date') return res.status(400).send({ error: 'Data do workshop inválida' });
      if (new Date(date) < Date.now()) return res.status(400).send({ error: 'Data do workshop deve ser no futuro' });
    }

    const owner = await User.findById(req.user.id);

    if (!owner) return res.status(500).send({ error: 'Usuário não encontrado' });
    if (owner.id !== req.user.id) return res.status(400).send({ error: 'Você não é o dono desse workshop' });

    const workshop = await Workshop.findById(id)
      .populate('owner')
      .populate({
        path: 'poll',
        populate: { path: 'subjects.voters' },
      });

    if (!workshop) return res.status(500).send({ error: 'Workshop não encontrado' });
    if (!workshop.status === 'ended') return res.status(400).send({ error: 'Workshop já foi encerrado' });

    if (date) workshop.date = date;

    await workshop.save();

    const voters = workshop.poll.subjects.reduce((acc, cur) => [...acc, ...cur.voters], []);

    voters.forEach((voter) => {
      const config = {
        to: voter.email,
        subject: `MeetFinder - Workshop - ${workshop.subject} (Alteração)`,
        text: `Olá! O workshop de uma enquete da qual você participou foi alterado.\nAnote as informações do workshop e não perca!\n\n${workshop.name}\nAssunto: ${workshop.subject}\nData: ${new Date(workshop.date).toLocaleString('pt-BR')}\nOrganizador: ${workshop.owner.name}\nSala: ${workshop.room}`,
      };

      mail(config);
    });

    return res.status(200).send(workshop.toClient());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
