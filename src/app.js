require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');

const configureRoutes = require('./routes');
const mongodb = require('./db/mongodb');
const cors = require('./middleware/cors');
const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const serverError = require('./middleware/serverError');

const app = express();
const port = process.env.PORT || '3000';


app.set('port', port);

app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors);
app.use(mongodb);
app.use(express.static('docs'));

configureRoutes(app);

app.use(notFound);
app.use(serverError);

app.listen(port, () => console.log(`Server is listening on port ${port} ...`));
