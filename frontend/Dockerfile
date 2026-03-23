FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage - serve with nginx which sets correct MIME types
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

# nginx config that handles React Router and sets correct MIME types
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location ~* \.(css)$ { \
    add_header Content-Type text/css; \
    expires 1y; \
    } \
    location ~* \.(js)$ { \
    add_header Content-Type application/javascript; \
    expires 1y; \
    } \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]