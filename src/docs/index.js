const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerJSON = require('./swagger.json');

const swaggerDefinition = swaggerJSON;

const options = {
  swaggerDefinition,
  apis: [path.resolve(__dirname, '../app.js')],
};

const configureDocs = (app) => {
  app.get('/swagger.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerJSDoc(options));
  });

  app.get('/docs', (_req, res) => {
    res.sendFile(path.join(__dirname, '/ui.html'));
  });
};

module.exports = configureDocs;
