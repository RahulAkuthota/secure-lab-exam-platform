FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache sshpass openssh-client
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
