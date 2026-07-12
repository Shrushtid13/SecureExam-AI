FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache make gcc g++ python3 && \
    npm install && \
    apk del make gcc g++ python3

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
