/**
 * Custom Error Class for API responses.
 * Simplifies throwing errors with specific HTTP statuses and messages.
 */
class CustomError extends Error {
    constructor(message, status, details = null) {
        super(message);
        this.status = status;
        this.details = details;
        this.name = this.constructor.name;
        this.isCustom = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Middleware to handle 404 Not Found errors for undefined routes.
 */
const routeNotFoundHandler = (req, res, next) => {
    next(new CustomError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

/**
 * Generic error handling middleware.
 * It formats the error response consistently.
 */
const genericErrorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    let responseBody = {
        error: "Internal server error",
    };

    if (err.isCustom || status < 500) {
        // Handle custom and client errors (4xx)
        responseBody.error = err.message || responseBody.error;
        if (err.details) {
            responseBody.details = err.details;
        }
    } else {
        // Log unexpected server errors (5xx)
        console.error("Critical Server Error:", err);
    }

    // Special handling for the required validation format
    if (status === 400 && responseBody.error === "Validation failed" && responseBody.details) {
        // Keep the required structure
    } else if (status === 400 && responseBody.details) {
        // Custom 400 errors usually have specific details
    } else if (status === 404 && responseBody.error === "Summary image not found") {
        // Keep required 404 image message
    } else if (status === 404) {
        responseBody.error = err.message || "Resource not found";
    }

    // Ensure the response matches the required formats
    if (status === 404 && responseBody.error.includes("not found")) {
         responseBody = { error: err.message.includes("Country") ? "Country not found" : responseBody.error };
    } else if (status === 400 && !responseBody.details) {
         responseBody = { error: "Validation failed", details: { error: responseBody.error } };
    } else if (status === 503) {
        // 503 errors should use the error message as the main 'error' field
        responseBody.error = err.message;
        if (err.details) responseBody.details = err.details;
    }


    return res.status(status).json(responseBody);
};

module.exports = {
    CustomError,
    routeNotFoundHandler,
    genericErrorHandler,
};
