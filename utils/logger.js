const { createLogger, format, transports } = require("winston")

const logger = createLogger({
    format : format.combine(
        format.timestamp(),
        format.printf(({timestamp, ip, level, message})=> `${timestamp} ${ip} [${level}] : ${message}`)
    ),
    transports : [new transports.File({filename : "logs/server.log"})]
})

module.exports = logger