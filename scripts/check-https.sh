#!/usr/bin/env bash
set -euo pipefail

DOMAINS=(
  "kunstradbasketball.de"
  "www.kunstradbasketball.de"
  "display.kunstradbasketball.de"
  "admin.kunstradbasketball.de"
  "audio.kunstradbasketball.de"
  "dashboard.kunstradbasketball.de"
)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

ok()   { echo -e "  ${GREEN}[OK]${RESET}  $*"; }
fail() { echo -e "  ${RED}[FAIL]${RESET} $*"; }
warn() { echo -e "  ${YELLOW}[WARN]${RESET} $*"; }
section() { echo -e "\n${CYAN}=== $* ===${RESET}"; }

ISSUES=()

section "1. DNS Resolution"
for domain in "${DOMAINS[@]}"; do
  ip=$(dig +short "$domain" A 2>/dev/null | head -1)
  if [[ -n "$ip" ]]; then
    ok "$domain -> $ip"
  else
    fail "$domain — no A record found"
    ISSUES+=("DNS: $domain has no A record")
  fi
done

section "2. Port Reachability (80 / 443)"
SERVER_IP=$(dig +short "kunstradbasketball.de" A 2>/dev/null | head -1)
if [[ -z "$SERVER_IP" ]]; then
  warn "Could not resolve main domain — skipping port checks"
else
  for port in 80 443; do
    if nc -zv -w 5 "$SERVER_IP" "$port" 2>/dev/null; then
      ok "Port $port on $SERVER_IP is reachable"
    else
      fail "Port $port on $SERVER_IP is NOT reachable"
      ISSUES+=("Port $port is blocked or not listening")
    fi
  done
fi

section "3. Caddy Certificate Status"
if docker compose exec -T caddy caddy certificates 2>/dev/null; then
  echo ""
else
  warn "Could not query Caddy certificates (is the container running?)"
  ISSUES+=("Caddy container not responding or caddy CLI unavailable")
fi

section "4. ACME / TLS Errors in Caddy Logs"
echo "Scanning last 200 log lines for ACME/TLS errors..."
acme_errors=$(docker compose logs --tail=200 caddy 2>/dev/null \
  | grep -iE "(acme|tls|certificate|challenge|http-01|dns-01|error|failed|refused)" \
  | grep -v "^$" || true)

if [[ -n "$acme_errors" ]]; then
  warn "Relevant log entries found:"
  echo "$acme_errors" | head -40
  ISSUES+=("ACME/TLS related log entries found — review above")
else
  ok "No obvious ACME/TLS errors in recent logs"
fi

section "5. HTTP → HTTPS Redirect Check"
for domain in "${DOMAINS[@]}"; do
  redirect=$(curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}" \
    --max-time 5 "http://$domain/" 2>/dev/null || echo "connection failed")
  if echo "$redirect" | grep -q "301\|302"; then
    ok "$domain: $redirect"
  else
    fail "$domain: $redirect (expected 301/302 redirect)"
    ISSUES+=("HTTP→HTTPS redirect missing or broken for $domain")
  fi
done

section "6. TLS Certificate Validity"
for domain in "${DOMAINS[@]}"; do
  expiry=$(echo | openssl s_client -connect "${domain}:443" -servername "$domain" 2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
  if [[ -n "$expiry" ]]; then
    ok "$domain — expires: $expiry"
  else
    fail "$domain — could not retrieve TLS certificate"
    ISSUES+=("TLS cert unreachable for $domain")
  fi
done

section "Summary"
if [[ ${#ISSUES[@]} -eq 0 ]]; then
  echo -e "${GREEN}All checks passed.${RESET}"
else
  echo -e "${RED}${#ISSUES[@]} issue(s) found:${RESET}"
  for issue in "${ISSUES[@]}"; do
    echo -e "  - $issue"
  done

  echo ""
  echo -e "${YELLOW}Recommended fix steps:${RESET}"
  echo "  1. Verify DNS A records point to this server's public IP."
  echo "     Run: dig +short kunstradbasketball.de A"
  echo ""
  echo "  2. Ensure ports 80 and 443 are open in the firewall/security group."
  echo "     Run: ufw status  (or check your cloud provider's security rules)"
  echo ""
  echo "  3. Restart Caddy to trigger fresh ACME certificate issuance:"
  echo "     docker compose restart caddy"
  echo "     docker compose logs -f caddy"
  echo ""
  echo "  4. Force Caddy to re-obtain certificates (clears cached state):"
  echo "     docker compose down caddy"
  echo "     docker volume rm \$(docker volume ls -q | grep caddy)"
  echo "     docker compose up -d caddy"
  echo ""
  echo "  5. If ACME challenges keep failing, check that port 80 is not blocked."
  echo "     Caddy's HTTP-01 challenge requires port 80 to be reachable from the internet."
fi
