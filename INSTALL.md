# Noctis Installation Guide

## System Requirements
* Ubuntu 22.04 or 24.04 (Dedicated server or VPS)
* Root or sudo access
* Minimum 2GB RAM (4GB+ recommended)
* Minimum 10GB free disk space
* Ports 80 and 443 available (if using a reverse proxy)
* Port 8080 (or your chosen app port) available
* Port 7880, 7881, 50000-50019/UDP available (if Voice/Video enabled)

## Clean Installation
We provide a one-liner installation script that installs Node 24, pnpm, Docker, configures the firewall, and automatically builds and deploys your Noctis instance.

To begin the installation, simply run:
```bash
sudo bash scripts/install.sh
```
The script will prompt you for a few configuration details (Host, Port, Admin email, Password) and then run non-interactively.

## Post-Install Steps

1. **Security**: Ensure your `.env` file and `config/config.json` are secure. Change your admin password after the first login if desired.
2. **Setup HTTPS**: We highly recommend putting Noctis behind a reverse proxy like [Caddy](https://caddyserver.com/) or Nginx for automatic HTTPS. For example, with Caddy:
   ```bash
   caddy reverse-proxy --from noctis.yourdomain.com --to localhost:8080
   ```
3. **Backups**: Run `sudo bash scripts/backup.sh` regularly or set up a cron job to keep your data safe.

## Troubleshooting

If you encounter issues during installation or runtime, refer to these common scenarios:

### 1. The script failed during memory/disk checks
**Fix**: Ensure your VPS meets the required minimum 10GB disk space and 2GB RAM. If you are very close to the limit and want to forcefully override, verify if there are dangling docker images (`docker system prune -a`) that can be deleted to recover space.

### 2. Node.js or pnpm installation failed
**Fix**: Sometimes Ubuntu's apt cache gets stale. Run `sudo apt-get update && sudo apt-get upgrade` before attempting the script again. 

### 3. Application shows "Unhealthy" or won't boot
**Fix**: Run `sudo bash scripts/logs.sh noctis_server` to view the server logs. Look for configuration errors (e.g. database file permissions, missing SMTP settings). Make sure `config/config.json` is properly written.

### 4. Search integration (Meilisearch) is not responding
**Fix**: Ensure you have enough RAM. Meilisearch can crash out of memory on small 1GB servers. Review `sudo bash scripts/logs.sh meilisearch`. Ensure the `MEILI_MASTER_KEY` matches between your `docker-compose.yml` (or `.env`) and `config/config.json`.

### 5. Cannot connect to Voice or Video channels
**Fix**: Ensure your VPS firewall allows port 7880 (TCP), 7881 (TCP), and ports 50000-50019 (UDP). Without UDP ports open, WebRTC media pathways will fail. You can verify your UFW rules by running `sudo ufw status`.
