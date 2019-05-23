const express = require('express');
const path = require('path');

const configureDocs = (app) => {
  app.use('/docs', express.static(path.resolve(__dirname, './template')));

  app.get('/docs', (_req, res) => {
    res.sendFile(path.resolve(__dirname, './template'));
  });
};

module.exports = configureDocs;
