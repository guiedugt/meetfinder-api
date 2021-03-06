require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const configureRoutes = require('./routes');
const mongodb = require('./db/mongodb');
const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const serverError = require('./middleware/serverError');

const app = express();
const port = process.env.PORT || '3000';


app.set('port', port);

app.use(cors({ exposedHeaders: ['x-token', 'x-count'] }));
app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(mongodb);
app.use(express.static('docs'));

configureRoutes(app);
mongoose.disconnect();

app.use(notFound);
app.use(serverError);

app.listen(port, () => console.log(`Server is listening on port ${port} ...`));
