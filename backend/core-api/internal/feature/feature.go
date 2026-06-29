package feature

import (
	"os"
	"strings"
	"sync"
)

type Flag struct {
	Key     string `json:"key"`
	Default bool   `json:"default"`
}

var (
	mu     sync.RWMutex
	flags  = map[string]bool{}
	prefix = "FEATURE_"
)

func Register(f Flag) {
	mu.Lock()
	defer mu.Unlock()
	flags[f.Key] = f.Default
}

func RegisterAll(list []Flag) {
	for _, f := range list {
		Register(f)
	}
}

func IsEnabled(key string) bool {
	mu.RLock()
	def, ok := flags[key]
	mu.RUnlock()
	if !ok {
		return false
	}
	envKey := prefix + key
	val := os.Getenv(envKey)
	if val == "" {
		return def
	}
	return strings.EqualFold(val, "true") || val == "1"
}

func All() map[string]bool {
	mu.RLock()
	defer mu.RUnlock()
	out := make(map[string]bool, len(flags))
	for k := range flags {
		out[k] = IsEnabled(k)
	}
	return out
}

var DefaultFlags = []Flag{
	{Key: "DARK_MODE", Default: false},
	{Key: "WEBHOOKS", Default: true},
	{Key: "ANOMALY_DETECTION", Default: false},
	{Key: "EXPORT_CSV", Default: true},
	{Key: "COURIER_ASSIGNMENTS", Default: true},
	{Key: "NOTIFICATIONS", Default: true},
	{Key: "ETA_PREDICTION", Default: true},
	{Key: "BETA_DASHBOARD", Default: false},
}
