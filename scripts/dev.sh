#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

get_wsl_ip() {
  python3 -c "import socket; s=socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()"
}

is_wsl() {
  grep -qi microsoft /proc/version 2>/dev/null
}

get_portproxy_target() {
  powershell.exe -NoProfile -Command "
    \$text = netsh interface portproxy show all | Out-String
    if (\$text -match '0\.0\.0\.0\s+${PORT}\s+(\S+)\s+${PORT}') { \$matches[1] }
  " 2>/dev/null | tr -d '\r\n'
}

get_lan_ip() {
  powershell.exe -NoProfile -Command "
    (Get-NetIPAddress -AddressFamily IPv4 |
      Where-Object { \$_.PrefixOrigin -eq 'Dhcp' -and \$_.IPAddress -notmatch '^169\.' } |
      Select-Object -First 1).IPAddress
  " 2>/dev/null | tr -d '\r\n'
}

lan_to_sslip() {
  echo "${1}.sslip.io"
}

update_port_forward() {
  local wsl_ip script_win
  wsl_ip="$(get_wsl_ip)"
  script_win="$(wslpath -w "$ROOT_DIR/scripts/wsl-port-forward.ps1")"

  if [[ "$(get_portproxy_target)" == "$wsl_ip" ]]; then
    return 0
  fi

  echo "Updating Windows port forward -> ${wsl_ip} (approve UAC if prompted)..."
  powershell.exe -NoProfile -Command \
    "Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"$script_win\"'"

  if [[ "$(get_portproxy_target)" != "$wsl_ip" ]]; then
    echo ""
    echo "Warning: port forward was not updated. Phone access may not work."
    echo "Run manually in elevated PowerShell:"
    echo "  powershell -ExecutionPolicy Bypass -File $script_win"
    echo ""
  fi
}

print_urls() {
  local lan_ip phone_host
  lan_ip="$(get_lan_ip)"

  echo ""
  echo "Local: http://localhost:${PORT}/"
  if [[ -n "$lan_ip" ]]; then
    phone_host="$(lan_to_sslip "$lan_ip")"
    export DEV_ALLOWED_ORIGINS="${lan_ip},${phone_host}"
    echo "Phone: http://${phone_host}:${PORT}/  (same Wi-Fi as this PC)"
    echo ""
    echo "Google login requires a domain (raw IP is rejected by Google OAuth)."
    echo "Add this redirect URI in Google Cloud Console:"
    echo "  http://${phone_host}:${PORT}/api/auth/callback/google"
    echo "Passkeys do not work over HTTP on LAN — use Google sign-in on phone."
  fi
  echo ""
}

if is_wsl; then
  update_port_forward
  print_urls
fi

export DEV_ALLOWED_ORIGINS="${DEV_ALLOWED_ORIGINS:-}"

exec bash "$ROOT_DIR/scripts/with-op-env.sh" sh -c "npx tsx scripts/db-check.ts && prisma generate && next dev -H 0.0.0.0 -p ${PORT}"
