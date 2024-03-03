FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

FROM scratch
WORKDIR /app
COPY --from=builder /app/build .

CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
EXPOSE 4173
