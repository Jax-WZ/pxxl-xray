FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache unzip
COPY package.json setup.js server.js ./
RUN node setup.js
CMD ["node", "server.js"]
