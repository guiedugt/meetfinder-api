const app = require('./app');

const port = process.env.PORT || '3000';

app.set('port', port);

app.on('error', (error) => {
  if (error.syscall !== 'listen') throw error;

  const message = {
    EACCES: `port ${port} requires elevated privilages`,
    EADDRINUSE: `port ${port} is already in use`,
  }[error.code];

  if (message) {
    console.log(message);
    process.exit(1);
  } else {
    throw error;
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port} ...`);
});
