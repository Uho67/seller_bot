# Deployment Guide — aromagood.net

## URL Map

| URL | What it serves |
|-----|----------------|
| `https://aromagood.net/` | Telegram Mini App (webapp) |
| `https://aromagood.net/uds2_badmin/` | Admin panel |
| `https://aromagood.net/api/` | Backend REST API |
| `https://aromagood.net/uploads/` | Uploaded product images |

Container runs on port **3012** (no conflict with other projects on port 3000).

---

## Architecture

```
Internet → VPS Nginx :443 (SSL) → Docker container :3012
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
git clone <your-repo-url> /var/www/aromagood
cd /var/www/aromagood
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
PORT=3012
ADMIN_PANEL_ORIGIN=https://aromagood.net
WEBAPP_URL=https://aromagood.net
```

### 4. Get SSL certificate (before starting Nginx with the full config)

```bash
sudo certbot certonly --standalone -d aromagood.net
```

### 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/aromagood.net
```

Paste:

```nginx
server {
    listen 80;
    server_name aromagood.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name aromagood.net;

    ssl_certificate /etc/letsencrypt/live/aromagood.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aromagood.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3012;
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
sudo ln -s /etc/nginx/sites-available/aromagood.net /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Build and start container

```bash
cd /var/www/aromagood
make deploy
```

### 7. Create admin user

```bash
docker exec aromagood node scripts/admin-cli.js create <username> <password>
```

---

## Redeploy (after code changes)

```bash
cd /var/www/aromagood
make deploy
```

This pulls the latest code, rebuilds the image, and restarts the container with zero config changes needed.

---

## Useful commands

```bash
make logs                                                    # stream container logs
make shell                                                   # shell into container

docker exec aromagood node scripts/admin-cli.js list         # list admin users
docker exec aromagood node scripts/admin-cli.js create <n> <pw>
docker exec aromagood node scripts/admin-cli.js update-password <n> <pw>
docker exec aromagood node scripts/admin-cli.js delete <n>
docker exec aromagood node scripts/admin-cli.js reset-file-ids  # clear Telegram file ID cache
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
2. Set the Mini App URL: `/newapp` or `/editapp` → URL = `https://aromagood.net`
3. Set menu button: `/setmenubutton` → URL = `https://aromagood.net`

The backend auto-registers the menu button on startup if `WEBAPP_URL` is set in `.env`.

---

## DNS Requirements

Point the following A record to your VPS IP before running certbot:

| Record | Type | Value |
|--------|------|-------|
| `aromagood.net` | A | `<VPS IP>` |
