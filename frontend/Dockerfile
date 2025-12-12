FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
# Use npm install to allow building when package-lock.json is missing
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
