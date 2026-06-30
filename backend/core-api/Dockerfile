FROM golang:1.25-alpine AS builder

WORKDIR /app
RUN go install github.com/air-verse/air@latest
COPY go.mod ./
RUN go mod tidy && go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o server ./cmd/server

# dev stage — full Go toolchain + air for hot-reload (used by docker-compose.override.yml)
FROM golang:1.25-alpine AS dev
WORKDIR /app
RUN go install github.com/air-verse/air@latest
COPY go.mod ./
RUN go mod tidy && go mod download
EXPOSE 8080
CMD ["air", "-c", ".air.toml"]

# prod stage — minimal image
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/server /server
COPY --from=builder /app/migrations /migrations
EXPOSE 8080
CMD ["/server"]