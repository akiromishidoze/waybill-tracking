package apierror

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

// APIError is a safe, structured error returned to API clients.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Error implements the error interface for contexts that need it.
func (e APIError) Error() string {
	return e.Message
}

// Status is the HTTP status code for the error.
type Status int

// JSON writes the error response to the client and logs the raw error.
func (e *APIError) JSON(c *gin.Context, status int, raw error) {
	logger := zap.L()
	if raw != nil {
		logger.Error("api error",
			zap.String("code", e.Code),
			zap.String("path", c.Request.URL.Path),
			zap.String("method", c.Request.Method),
			zap.Error(raw),
		)
	}
	c.JSON(status, e)
}

// Internal returns a generic internal-server-error response.
func Internal(raw error) *APIError {
	return &APIError{Code: "internal_error", Message: "An internal error occurred"}
}

// InternalJSON writes an internal error response.
func InternalJSON(c *gin.Context, raw error) {
	Internal(raw).JSON(c, http.StatusInternalServerError, raw)
}

// BadRequest returns a bad-request response.
func BadRequest(message string) *APIError {
	return &APIError{Code: "bad_request", Message: message}
}

// BadRequestJSON writes a bad-request response.
func BadRequestJSON(c *gin.Context, message string) {
	BadRequest(message).JSON(c, http.StatusBadRequest, nil)
}

// BadRequestJSONErr writes a bad-request response and logs the raw error.
func BadRequestJSONErr(c *gin.Context, raw error) {
	BadRequest("Invalid request").JSON(c, http.StatusBadRequest, raw)
}

// NotFound returns a not-found response.
func NotFound(message string) *APIError {
	return &APIError{Code: "not_found", Message: message}
}

// NotFoundJSON writes a not-found response.
func NotFoundJSON(c *gin.Context, message string) {
	NotFound(message).JSON(c, http.StatusNotFound, nil)
}

// Unauthorized returns an unauthorized response.
func Unauthorized(message string) *APIError {
	return &APIError{Code: "unauthorized", Message: message}
}

// UnauthorizedJSON writes an unauthorized response.
func UnauthorizedJSON(c *gin.Context, message string) {
	Unauthorized(message).JSON(c, http.StatusUnauthorized, nil)
}

// Forbidden returns a forbidden response.
func Forbidden(message string) *APIError {
	return &APIError{Code: "forbidden", Message: message}
}

// ForbiddenJSON writes a forbidden response.
func ForbiddenJSON(c *gin.Context, message string) {
	Forbidden(message).JSON(c, http.StatusForbidden, nil)
}

// Conflict returns a conflict response.
func Conflict(message string) *APIError {
	return &APIError{Code: "conflict", Message: message}
}

// ConflictJSON writes a conflict response.
func ConflictJSON(c *gin.Context, message string) {
	Conflict(message).JSON(c, http.StatusConflict, nil)
}

// MapDB maps common PostgreSQL errors to safe API errors.
// It returns nil if the error is not recognized.
func MapDB(err error) *APIError {
	if err == nil {
		return nil
	}
	if err == pgx.ErrNoRows {
		return NotFound("Resource not found")
	}
	return Internal(err)
}

// MapDBJSON maps common PostgreSQL errors and writes the response.
// It returns true if a response was written.
func MapDBJSON(c *gin.Context, err error) bool {
	apiErr := MapDB(err)
	if apiErr == nil {
		return false
	}
	status := http.StatusInternalServerError
	if apiErr.Code == "not_found" {
		status = http.StatusNotFound
	}
	apiErr.JSON(c, status, err)
	return true
}
