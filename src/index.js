require('dotenv').config();

const app = require('express')();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const mongodb = require('./db/mongodb');
const notFound = require('./middleware/notFound');
const serverError = require('./middleware/serverError');
const configureRoutes = require('./routes');

configureRoutes(app);

const port = process.env.PORT || '3000';

app.set('port', port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
  next();
});

app.use(compression);
app.use(mongodb.connect);
app.use(notFound);
app.use(serverError);

app.listen(port, () => {
  console.log(`Server is listening on port ${port} ...`);
});
