#!/usr/bin/env bash
# deploy.sh — upload KryptOS Web to Hostinger via FTP.
#
# Fill these 4 in (or pass as env vars), then run:  bash deploy.sh
# The subdomain (kryptos.krypton-lang.org) must already exist in hPanel.
set -e

FTP_HOST="${FTP_HOST:-ftp.krypton-lang.org}"     # Hostinger FTP host (hPanel → FTP Accounts)
FTP_USER="${FTP_USER:-}"                          # FTP username
FTP_PASS="${FTP_PASS:-}"                          # FTP password
FTP_DIR="${FTP_DIR:-/public_html/kryptos}"        # subdomain folder (from hPanel)

[ -z "$FTP_USER" ] && { read -rp "FTP user: " FTP_USER; }
[ -z "$FTP_PASS" ] && { read -rsp "FTP pass: " FTP_PASS; echo; }

cd "$(dirname "$0")"
FILES=$(find . -type f \
  -not -path './.git/*' -not -name '.DS_Store' -not -name 'deploy.sh' \
  -not -name '*.log' | sed 's|^\./||')

echo "Uploading to ftp://$FTP_HOST$FTP_DIR  ($(echo "$FILES" | wc -l | tr -d ' ') files)…"

if command -v lftp >/dev/null 2>&1; then
  lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" -e "
    set ftp:ssl-allow no;
    mirror -R --delete --verbose --exclude .git/ --exclude .DS_Store --exclude deploy.sh . $FTP_DIR;
    bye"
else
  # curl fallback — per-file, auto-creates dirs
  while IFS= read -r f; do
    curl -s --ftp-create-dirs -T "$f" "ftp://$FTP_HOST$FTP_DIR/$f" \
      --user "$FTP_USER:$FTP_PASS" && echo "  ↑ $f" || echo "  ✗ $f"
  done <<< "$FILES"
fi

echo "Done. Visit https://kryptos.krypton-lang.org/"
