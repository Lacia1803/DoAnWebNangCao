# Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install --only=production

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
