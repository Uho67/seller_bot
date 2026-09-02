# Deployment Guide

## Stack

- **Backend**: NestJS, port `3004`
- **Admin panel**: React (Vite) — built inside Docker, served by the backend at `/`
- **Web server**: Nginx (reverse proxy)
- **Domain**: `https://uho.kharkiv.ua/lunvo_new`
- **Runtime**: Docker (single container for backend + admin)

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
git clone <your-repo-url> lunvo_new
cd lunvo_new
```

---

## 3. Backend environment

Create `/var/www/lunvo_new/backend/.env`:

```env
PORT=3004
BOT_TOKEN=your_telegram_bot_token_here
JWT_SECRET=some_long_random_secret
ADMIN_PANEL_ORIGIN=https://uho.kharkiv.ua
```

---

## 4. Build and start (one command)

```bash
cd /var/www/lunvo_new
docker compose up -d --build
```

This builds both the admin panel and the backend inside Docker, then starts the container.

Verify:

```bash
docker compose ps
curl http://localhost:3004/api
curl http://localhost:3004          # should return admin panel HTML
```

View logs:

```bash
docker compose logs -f
```

---

## 5. Nginx configuration

Since the Docker container serves both the admin panel and the API, nginx only needs to proxy everything to the container.

Create `/etc/nginx/sites-available/lunvo_new`:

```nginx
server {
    listen 80;
    server_name uho.kharkiv.ua;

    # Proxy everything to the Docker container
    location /lunvo_new/ {
        rewrite ^/lunvo_new/(.*)$ /$1 break;
        proxy_pass http://localhost:3004;
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
sudo ln -s /etc/nginx/sites-available/lunvo_new /etc/nginx/sites-enabled/
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

| Resource        | URL                                           |
|-----------------|-----------------------------------------------|
| Admin panel     | `https://uho.kharkiv.ua/lunvo_new/`        |
| REST API        | `https://uho.kharkiv.ua/lunvo_new/api/`    |
| Uploaded images | `https://uho.kharkiv.ua/lunvo_new/uploads/`|
| Container direct| `http://localhost:3004` (internal only)       |

---

## 8. Redeploy after changes

```bash
cd /var/www/lunvo_new
git pull
docker compose up -d --build
```

One command rebuilds everything (admin + backend) and restarts the container.
