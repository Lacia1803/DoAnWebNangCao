# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production || npm install

COPY . .

# Build can be added for production; for dev we can start CRA
EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"]
