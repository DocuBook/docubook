---
'@docubook/flame': patch
---

Remove `USER nginx` from Dockerfile template to prevent container crash

The `USER nginx` directive causes nginx to fail creating cache directories
(`/var/cache/nginx/client_temp`) with permission denied, killing the
container immediately. Since the container only serves static HTML, no
cache directories are needed — removing the directive lets the container
run as root (default) while nginx worker processes still run as `nginx`.
