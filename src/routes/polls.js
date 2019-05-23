const router = require('express').Router();
const mongoose = require('mongoose');

const Poll = require('../models/poll');
const Subject = require('../models/subject');

/**
 * @api {get} /polls Fetch all polls
 * @apiName GetPolls
 * @apiGroup Polls
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    message: 'polls were fetched',
  });
});

router.post('/', (req, res) => {
  const poll = new Poll({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
  });

  const subjects = req.body.subjects.map((subject) => {
    return new Subject({
      name: subject.name,
    });
  });

  res.status(201).json(poll);
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
