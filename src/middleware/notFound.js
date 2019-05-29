const notFound = (_req, res) => {
  res.status(404).send({ error: 'Recurso não encontrado' });
};

module.exports = notFound;
