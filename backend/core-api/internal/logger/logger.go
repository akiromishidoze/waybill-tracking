package logger

import (
	"context"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type contextKey string

const requestIDKey contextKey = "request_id"

var global *zap.Logger

func init() {
	global = build()
}

func build() *zap.Logger {
	enc := zapcore.EncoderConfig{
		TimeKey:        "ts",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		MessageKey:     "msg",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.LowercaseLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.MillisDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	level := zap.InfoLevel
	if os.Getenv("LOG_LEVEL") == "debug" {
		level = zap.DebugLevel
	}

	core := zapcore.NewCore(
		zapcore.NewJSONEncoder(enc),
		zapcore.AddSync(os.Stdout),
		level,
	)

	return zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
}

// L returns the global logger.
func L() *zap.Logger {
	return global
}

// WithRequestID returns a logger pre-tagged with the given request ID.
func WithRequestID(reqID string) *zap.Logger {
	return global.With(zap.String("request_id", reqID))
}

// FromContext extracts the request ID stored by the middleware and returns a tagged logger.
func FromContext(ctx context.Context) *zap.Logger {
	if rid, ok := ctx.Value(requestIDKey).(string); ok && rid != "" {
		return global.With(zap.String("request_id", rid))
	}
	return global
}

// Sync flushes any buffered log entries. Call at program exit.
func Sync() {
	_ = global.Sync()
}
