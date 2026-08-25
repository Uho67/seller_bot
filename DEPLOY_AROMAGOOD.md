# Deployment Guide — aromavawe.org

## URL Map

| URL | What it serves |
|-----|----------------|
| `https://aromavawe.org/` | Telegram Mini App (webapp) |
| `https://aromavawe.org/uds2_badmin/` | Admin panel |
| `https://aromavawe.org/api/` | Backend REST API |
| `https://aromavawe.org/uploads/` | Uploaded product images |

Container runs on port **3010** (no conflict with other projects on port 3000).

---

## Architecture

```
Internet → VPS Nginx :443 (SSL) → Docker container :3010
                                        ├── /             → webapp static files
                                        ├── /uds2_badmin/ → admin panel static files
                                        ├── /api/         → NestJS API
                                        └── /uploads/     → uploaded images
```

Nginx handles SSL termination only. All routing is done inside NestJS via `ServeStaticModule`.

---

## First-Time VPS Setup

### 1. Install dependencies

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
sudo systemctl enable --now docker nginx
```

### 2. Clone repository

```bash
git clone <your-repo-url> /var/www/aromavawe
cd /var/www/aromavawe
```

### 3. Configure backend environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in:
```env
BOT_TOKEN=<your_telegram_bot_token>
JWT_SECRET=<long_random_string>
PORT=3010
ADMIN_PANEL_ORIGIN=https://aromavawe.org
WEBAPP_URL=https://aromavawe.org
```

### 4. Get SSL certificate (before starting Nginx with the full config)

```bash
sudo certbot certonly --standalone -d aromavawe.org
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/aromavawe.org
```

Paste:

```nginx
server {
    listen 80;
    server_name aromavawe.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name aromavawe.org;

    ssl_certificate /etc/letsencrypt/live/aromavawe.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aromavawe.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/aromavawe.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Build and start container

```bash
cd /var/www/aromavawe
make deploy
```

### 7. Create admin user

```bash
docker exec aromavawe node scripts/admin-cli.js create <username> <password>
```

---

## Redeploy (after code changes)

```bash
cd /var/www/aromavawe
make deploy
```

This pulls the latest code, rebuilds the image, and restarts the container with zero config changes needed.

---

## Useful commands

```bash
make logs                                                       # stream container logs
make shell                                                      # shell into container

docker exec aromavawe node scripts/admin-cli.js list
docker exec aromavawe node scripts/admin-cli.js create <n> <pw>
docker exec aromavawe node scripts/admin-cli.js update-password <n> <pw>
docker exec aromavawe node scripts/admin-cli.js delete <n>
docker exec aromavawe node scripts/admin-cli.js reset-file-ids  # clear Telegram file ID cache
```

### Nginx logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL renewal (auto via certbot timer, manual if needed)

```bash
sudo certbot renew --dry-run
sudo certbot renew
sudo systemctl reload nginx
```

---

## Telegram Bot Setup

1. Open [@BotFather](https://t.me/BotFather)
2. Set the Mini App URL: `/newapp` or `/editapp` → URL = `https://aromavawe.org`
3. Set menu button: `/setmenubutton` → URL = `https://aromavawe.org`

The backend auto-registers the menu button on startup if `WEBAPP_URL` is set in `.env`.

---

## DNS Requirements

Point the following A record to your VPS IP before running certbot:

| Record | Type | Value |
|--------|------|-------|
| `aromavawe.org` | A | `<VPS IP>` |
