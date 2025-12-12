FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies first (leveraging package.json)
COPY package*.json ./
# Use npm install so the image can be built even without a lockfile
RUN npm install --no-audit --no-fund

# Copy app source
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
