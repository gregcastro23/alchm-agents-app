import { logger } from '../utils/logger.js';
export const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    // Log request
    logger.info('Incoming request:', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length')
    });
    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = function (chunk, encoding, cb) {
        const responseTime = Date.now() - startTime;
        logger.info('Request completed:', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            contentLength: res.get('Content-Length')
        });
        // Call the original end method
        originalEnd.call(this, chunk, encoding, cb);
    };
    next();
};
//# sourceMappingURL=request-logger.js.map