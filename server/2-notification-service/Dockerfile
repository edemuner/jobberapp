FROM node:26-alpine3.23 as builder

WORKDIR /app
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}
COPY package.json ./
COPY tsconfig.json ./
COPY .npmrc ./
COPY src ./src
RUN npm install -g npm@latest
RUN npm ci && npm run build

FROM node:26-alpine3.23

WORKDIR /app
RUN apk add --no-cache curl
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}
COPY package.json ./
COPY tsconfig.json ./
COPY .npmrc ./
RUN npm install -g pm2 npm@latest
RUN npm ci --production
COPY --from=builder /app/build ./build

EXPOSE 4001

CMD [ "npm", "run", "start" ]