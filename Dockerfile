FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
EXPOSE 4173
