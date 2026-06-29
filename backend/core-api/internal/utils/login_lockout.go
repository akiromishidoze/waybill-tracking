package utils

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	maxFailedAttempts = 5
	lockoutWindow     = 15 * time.Minute
)

// IsAccountLocked returns true if the email has exceeded the allowed failed login attempts.
func IsAccountLocked(ctx context.Context, rdb *redis.Client, email string) bool {
	if rdb == nil {
		return false
	}
	key := lockoutKey(email)
	count, err := rdb.Get(ctx, key).Int()
	if err != nil {
		return false
	}
	return count >= maxFailedAttempts
}

// RecordFailedLogin increments the failed login counter for the email and returns the new count.
func RecordFailedLogin(ctx context.Context, rdb *redis.Client, email string) int {
	if rdb == nil {
		return 0
	}
	key := lockoutKey(email)
	count, err := rdb.Incr(ctx, key).Result()
	if err != nil {
		return 0
	}
	if count == 1 {
		rdb.Expire(ctx, key, lockoutWindow)
	}
	return int(count)
}

// ClearFailedLogin resets the failed login counter for the email after a successful login.
func ClearFailedLogin(ctx context.Context, rdb *redis.Client, email string) {
	if rdb == nil {
		return
	}
	rdb.Del(ctx, lockoutKey(email))
}

func lockoutKey(email string) string {
	return fmt.Sprintf("login:failed:%s", email)
}
