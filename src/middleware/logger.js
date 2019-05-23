const logger = (req, _res, next) => {
  if (!req.url.match(/\.(js|css)/)) {
    console.log(req.method, req.url);
  }
  next();
};

module.exports = logger;
