# Deployment Guide

## Stack

- **Backend**: NestJS, port `3009`
- **Admin panel**: React (Vite), served as static files
- **Web server**: Nginx (reverse proxy + static hosting)
- **Domain**: `https://uho.kharkiv.ua/siga_2`
- **Process manager**: PM2

---

## 1. Server preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx nodejs npm git
npm install -g pm2
```

---

## 2. Clone and build

```bash
cd /var/www
git clone <your-repo-url> pachka
cd pachka
```

### Build backend

```bash
cd backend
npm install --legacy-peer-deps
npm run build
```

### Build admin panel

```bash
cd ../admin
npm install --legacy-peer-deps
npm run build
# dist/ is the output folder
```

---

## 3. Backend environment

Create `/var/www/pachka/backend/.env`:

```env
PORT=3009
BOT_TOKEN=your_telegram_bot_token_here
```

---

## 4. Start backend with PM2

```bash
cd /var/www/pachka/backend
pm2 start dist/main.js --name siga_bot_backend
pm2 save
pm2 startup
```

Verify it's running:

```bash
pm2 status
curl http://localhost:3009/api
```

---

## 5. Nginx configuration

Create `/etc/nginx/sites-available/pachka`:

```nginx
server {
    listen 80;
    server_name uho.kharkiv.ua;

    # Admin panel static files — served at /pachka/
    location /pachka/ {
        alias /var/www/pachka/admin/dist/;
        try_files $uri $uri/ /pachka/index.html;
    }

    # Backend API — proxied at /pachka/api/
    location /pachka/api/ {
        rewrite ^/pachka/api/(.*)$ /api/$1 break;
        proxy_pass http://localhost:3009;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploaded files — proxied at /pachka/uploads/
    location /pachka/uploads/ {
        rewrite ^/pachka/uploads/(.*)$ /uploads/$1 break;
        proxy_pass http://localhost:3009;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/siga_bot /etc/nginx/sites-enabled/
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

Certbot will auto-patch the nginx config to redirect HTTP → HTTPS.

---

## 7. Vite base path

Because the admin panel is served under `/pachka/`, Vite must know the base path at build time.

In `admin/vite.config.ts`, add `base`:

```ts
export default defineConfig({
  base: '/pachka/',
  plugins: [react()],
  // ...
});
```

Then rebuild:

```bash
cd /var/www/pachka/admin
npm run build
```

---

## 8. API base URL in admin panel

The admin panel's API calls must use the `/pachka/api` prefix in production.
Use an environment variable in `admin/.env.production`:

```env
VITE_API_BASE=/siga_2/api
```

Update any hardcoded `/api` references in the frontend to use `import.meta.env.VITE_API_BASE`.

---

## 9. URL summary

| Resource        | URL                                      |
|-----------------|------------------------------------------|
| Admin panel     | `https://uho.kharkiv.ua/pachka/`        |
| REST API        | `https://uho.kharkiv.ua/pachka/api/`    |
| Uploaded images | `https://uho.kharkiv.ua/pachka/uploads/`|
| Backend direct  | `http://localhost:3009` (internal only)  |

---

## 10. Redeploy after changes

```bash
cd /var/www/siga_bot
git pull

# Backend
cd backend && npm install --legacy-peer-deps && npm run build
pm2 restart pachka

# Admin
cd ../admin && npm install --legacy-peer-deps && npm run build
```
