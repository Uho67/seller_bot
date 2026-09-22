# Deployment Guide

## Stack

- **Backend**: NestJS, port `3011`
- **Admin panel**: React (Vite) — built inside Docker, served by the backend at `/`
- **Web server**: Nginx (reverse proxy)
- **Domain**: `https://uho.kharkiv.ua/smoke`
- **Runtime**: Docker (single container for backend + admin), image/container name: `smoke`

---

## 1. Server preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

---

## 2. Clone

```bash
cd /var/www
git clone <your-repo-url> smoke
cd smoke
```

---

## 3. Backend environment

Create `/var/www/smoke/backend/.env`:

```env
PORT=3011
BOT_TOKEN=your_telegram_bot_token_here
JWT_SECRET=some_long_random_secret
ADMIN_PANEL_ORIGIN=https://uho.kharkiv.ua
```

---

## 4. Build and start (one command)

```bash
cd /var/www/smoke
docker compose up -d --build
```

This builds both the admin panel and the backend inside Docker, then starts the container.

Verify:

```bash
docker compose ps
curl http://localhost:3011/api
curl http://localhost:3011          # should return admin panel HTML
```

View logs:

```bash
docker compose logs -f
```

---

## 5. Nginx configuration

Since the Docker container serves both the admin panel and the API, nginx only needs to proxy everything to the container.

Create `/etc/nginx/sites-available/smoke`:

```nginx
server {
    listen 80;
    server_name uho.kharkiv.ua;

    # Proxy everything to the Docker container
    location /smoke/ {
        rewrite ^/smoke/(.*)$ /$1 break;
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/smoke /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. HTTPS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d uho.kharkiv.ua
sudo systemctl reload nginx
```

---

## 7. URL summary

| Resource        | URL                                      |
|-----------------|------------------------------------------|
| Admin panel     | `https://uho.kharkiv.ua/smoke/`         |
| REST API        | `https://uho.kharkiv.ua/smoke/api/`     |
| Uploaded images | `https://uho.kharkiv.ua/smoke/uploads/` |
| Container direct| `http://localhost:3011` (internal only)  |

---

## 8. Redeploy after changes

```bash
cd /var/www/smoke
git pull
docker compose up -d --build
```

One command rebuilds everything (admin + backend) and restarts the container.
