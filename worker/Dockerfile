FROM node:20-alpine

WORKDIR /worker

# Install docker CLI inside container
RUN apk add --no-cache docker-cli

COPY package*.json ./
RUN npm install --production

COPY worker.js ./
COPY ensure-executors.sh ./
RUN chmod +x /worker/ensure-executors.sh

CMD ["/worker/ensure-executors.sh"]
