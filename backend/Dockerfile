# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY ./frontend/package.json ./frontend/package-lock.json* ./
RUN npm install
COPY ./frontend/ ./
RUN npm run build

# Stage 2: Build the Go backend
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY ./backend/go.mod ./backend/go.sum ./
RUN go mod download
COPY ./backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o echo-server ./cmd/server

# Stage 3: Final image
FROM alpine:latest
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend-builder /app/echo-server .
COPY --from=frontend-builder /frontend/dist ./frontend/dist
COPY ./sql/schema.sql ./schema.sql
EXPOSE 8080
CMD ["./echo-server"]
