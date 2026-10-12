FROM node:20-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
CMD ["node","-e","require('ts-node').register(); require('./src/main')"]
