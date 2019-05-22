const serverError = (error, _req, res) => {
  res.status(error.status || 500);
  res.json({ error: { message: error.message } });
};

module.exports = serverError;
