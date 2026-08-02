# Deployment Guide

## Stack

- **Backend**: NestJS, port `3006`
- **Admin panel**: React (Vite) — built inside Docker, served by the backend at `/`
- **Web server**: Nginx (reverse proxy)
- **Domain**: `https://uho.kharkiv.ua/steam_bot`
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
git clone <your-repo-url> siga_first
cd siga_first
```

---

## 3. Backend environment

Create `/var/www/siga_first/backend/.env`:

```env
PORT=3006
BOT_TOKEN=your_telegram_bot_token_here
JWT_SECRET=some_long_random_secret
ADMIN_PANEL_ORIGIN=https://uho.kharkiv.ua
```

---

## 4. Build and start (one command)

```bash
cd /var/www/siga_first
docker compose up -d --build
```

This builds both the admin panel and the backend inside Docker, then starts the container.

Verify:

```bash
docker compose ps
curl http://localhost:3006/api
curl http://localhost:3006          # should return admin panel HTML
```

View logs:

```bash
docker compose logs -f
```

---

## 5. Nginx configuration

Since the Docker container serves both the admin panel and the API, nginx only needs to proxy everything to the container.

Create `/etc/nginx/sites-available/steam_bot`:

```nginx
server {
    listen 80;
    server_name uho.kharkiv.ua;

    # Proxy everything to the Docker container
    location /steam_bot/ {
        rewrite ^/steam_bot/(.*)$ /$1 break;
        proxy_pass http://localhost:3006;
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
sudo ln -s /etc/nginx/sites-available/steam_bot /etc/nginx/sites-enabled/
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
| Admin panel     | `https://uho.kharkiv.ua/steam_bot/`        |
| REST API        | `https://uho.kharkiv.ua/steam_bot/api/`    |
| Uploaded images | `https://uho.kharkiv.ua/steam_bot/uploads/`|
| Container direct| `http://localhost:3006` (internal only)  |

---

## 8. Check Nginx logs

```bash
# Access log (all requests)
sudo tail -f /var/log/nginx/access.log

# Error log (4xx/5xx, config issues)
sudo tail -f /var/log/nginx/error.log

# Last 100 error lines
sudo tail -n 100 /var/log/nginx/error.log

# Filter only this site's errors (if you use a named log file)
sudo tail -f /var/log/nginx/steam_bot.error.log

# Check nginx status
sudo systemctl status nginx

# Test nginx config without reloading
sudo nginx -t
```

---

## 9. Redeploy after changes

```bash
cd /var/www/siga_first
git pull
docker compose up -d --build
```

One command rebuilds everything (admin + backend) and restarts the container.
