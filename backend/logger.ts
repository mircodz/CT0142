const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");

const lokiConfig = require('config').get('loki');

const options = {
  transports: [
    new LokiTransport({
      host: lokiConfig.url,
      onConnectionError: (err) => console.error(err)
    })
  ]
};

const logger = createLogger(options);

module.exports = { logger }

