# Usage Guide

## Admin CLI

Manage admin accounts for the siga_bot admin panel.

### Without Docker (local development)

Run from the `backend/` directory:

```bash
cd backend

# List all admins
npm run admin -- list

# Create a new admin
npm run admin -- create <name> <password>

# Change an admin's password
npm run admin -- update-password <name> <new-password>

# Delete an admin
npm run admin -- delete <name>
```

**Examples:**

```bash
npm run admin -- create alice secret123
npm run admin -- update-password admin newpassword
npm run admin -- delete alice
```

> The DB is read from `backend/data/database.sqlite` by default.
> Override with `DB_PATH=/path/to/database.sqlite npm run admin -- list`.

---

### With Docker

The container is named `siga_bot`. Run the CLI inside it with `docker exec`:

```bash
# List all admins
docker exec siga_bot node scripts/admin-cli.js list

# Create a new admin
docker exec siga_bot node scripts/admin-cli.js create <name> <password>

# Change an admin's password
docker exec siga_bot node scripts/admin-cli.js update-password <name> <new-password>

# Delete an admin
docker exec siga_bot node scripts/admin-cli.js delete <name>
```

**Examples:**

```bash
docker exec siga_bot node scripts/admin-cli.js create alice secret123
docker exec siga_bot node scripts/admin-cli.js update-password admin newpassword
docker exec siga_bot node scripts/admin-cli.js delete alice
```

> Inside the container the database is at `/app/data/database.sqlite` and is mounted from `./backend/data/` on the host, so changes persist across restarts.

---

## Notes

- You cannot delete the last remaining admin.
- Passwords are hashed with bcrypt (cost factor 10) before being stored.
- Admin names must be unique.
