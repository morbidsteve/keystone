#!/usr/bin/env bash
# =============================================================================
# KEYSTONE — One-Command Install & Launch Script
# =============================================================================
# Usage:
#   ./install.sh              # Install and start everything
#   ./install.sh --demo       # Start with simulator (live demo data)
#   ./install.sh --stop       # Stop all services
#   ./install.sh --reset      # Full reset (destroys data, rebuilds from scratch)
#   ./install.sh --status     # Show service status and health
#   ./install.sh --help       # Show usage
# =============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ─────────────────────────────────────────────────────────────────
log()   { printf "${GREEN}[KEYSTONE]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[WARNING]${NC} %s\n" "$*"; }
err()   { printf "${RED}[ERROR]${NC} %s\n" "$*" >&2; }
info()  { printf "${CYAN}  →${NC} %b\n" "$*"; }
header() { printf "\n${BOLD}${BLUE}═══ %s ═══${NC}\n\n" "$*"; }

# ── Resolve script directory ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Parse arguments ─────────────────────────────────────────────────────────
MODE="install"
DEMO=false
for arg in "$@"; do
    case "$arg" in
        --demo)   DEMO=true ;;
        --stop)   MODE="stop" ;;
        --reset)  MODE="reset" ;;
        --status) MODE="status" ;;
        --help|-h) MODE="help" ;;
        *) err "Unknown argument: $arg"; MODE="help" ;;
    esac
done

# ── Help ────────────────────────────────────────────────────────────────────
if [ "$MODE" = "help" ]; then
    cat <<'USAGE'
KEYSTONE — USMC Logistics Common Operating Picture

Usage:
  ./install.sh              Install prerequisites, build, and start all services
  ./install.sh --demo       Same as above + start the simulator with live data
  ./install.sh --stop       Stop all services (preserves data)
  ./install.sh --reset      Stop services, destroy volumes, rebuild from scratch
  ./install.sh --status     Show service health and access URLs

Requirements:
  - Docker Engine 24+ with Docker Compose v2
  - 4 GB RAM minimum (8 GB recommended)
  - Ports: 443 (HTTPS), 8000 (API), 5432 (PostgreSQL), 6379 (Redis)

Default Credentials (development only):
  admin/admin123        System Administrator
  commander/cmd123      Battalion Commander
  s4officer/s4pass123   S-4 Logistics Officer
  s3officer/s3pass123   S-3 Operations Officer
  operator/op123        Logistics Operator
  armorer/arm123        Unit Armorer
  viewer/view123        Read-Only Viewer

USAGE
    exit 0
fi

# ── Stop ────────────────────────────────────────────────────────────────────
if [ "$MODE" = "stop" ]; then
    header "Stopping KEYSTONE"
    docker compose down 2>/dev/null || true
    docker compose --profile demo down 2>/dev/null || true
    log "All services stopped."
    exit 0
fi

# ── Status ──────────────────────────────────────────────────────────────────
if [ "$MODE" = "status" ]; then
    header "KEYSTONE Service Status"
    docker compose ps 2>/dev/null || { err "Services not running."; exit 1; }
    echo ""
    # Health checks
    log "Checking health..."
    if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
        info "Backend API:  ${GREEN}HEALTHY${NC}  → http://localhost:8000/docs"
    else
        info "Backend API:  ${RED}DOWN${NC}"
    fi
    if curl -sk https://localhost/ >/dev/null 2>&1; then
        info "Frontend:     ${GREEN}HEALTHY${NC}  → https://localhost"
    else
        info "Frontend:     ${RED}DOWN${NC}"
    fi
    if docker compose exec -T db pg_isready -U keystone >/dev/null 2>&1; then
        info "PostgreSQL:   ${GREEN}HEALTHY${NC}"
    else
        info "PostgreSQL:   ${RED}DOWN${NC}"
    fi
    if docker compose exec -T redis redis-cli -a keystone_redis_dev ping >/dev/null 2>&1; then
        info "Redis:        ${GREEN}HEALTHY${NC}"
    else
        info "Redis:        ${RED}DOWN${NC}"
    fi
    exit 0
fi

# ── Reset ───────────────────────────────────────────────────────────────────
if [ "$MODE" = "reset" ]; then
    header "Resetting KEYSTONE"
    warn "This will destroy ALL data (database, Redis cache)."
    printf "  Continue? [y/N] "
    read -r confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        log "Aborted."
        exit 0
    fi
    docker compose --profile demo down -v 2>/dev/null || true
    docker builder prune -f >/dev/null 2>&1 || true
    log "Volumes destroyed. Rebuilding..."
    MODE="install"
fi

# =============================================================================
# INSTALL & START
# =============================================================================
header "KEYSTONE Installer"

# ── 1. Check prerequisites ──────────────────────────────────────────────────
log "Checking prerequisites..."

# Docker
if ! command -v docker &>/dev/null; then
    err "Docker is not installed."
    info "Install Docker: https://docs.docker.com/engine/install/"
    exit 1
fi
DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>/dev/null || echo "0")
info "Docker Engine: v${DOCKER_VERSION}"

# Docker Compose v2
if ! docker compose version &>/dev/null; then
    err "Docker Compose v2 is not available."
    info "Install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "unknown")
info "Docker Compose: v${COMPOSE_VERSION}"

# Check Docker daemon is running
if ! docker info &>/dev/null; then
    err "Docker daemon is not running."
    info "Start Docker: sudo systemctl start docker"
    exit 1
fi

# Check available memory
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo 2>/dev/null | awk '{print $2}' || echo "0")
TOTAL_MEM_GB=$((TOTAL_MEM_KB / 1024 / 1024))
if [ "$TOTAL_MEM_GB" -lt 3 ]; then
    warn "System has ${TOTAL_MEM_GB}GB RAM. KEYSTONE recommends at least 4GB."
fi
info "System memory: ${TOTAL_MEM_GB}GB"

# Check port availability
for port in 443 8000 5432 6379; do
    if ss -tlnp 2>/dev/null | grep -q ":${port} " || \
       netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
        # Check if it's our own containers
        if docker compose ps 2>/dev/null | grep -q "running"; then
            continue
        fi
        warn "Port ${port} is already in use. KEYSTONE may fail to start."
    fi
done

log "Prerequisites OK."

# ── 2. Build and start services ─────────────────────────────────────────────
echo ""
if [ "$DEMO" = true ]; then
    log "Building and starting KEYSTONE with simulator..."
    docker compose --profile demo up --build -d 2>&1 | \
        grep -E "Created|Started|Healthy|Error|error" || true
else
    log "Building and starting KEYSTONE..."
    docker compose up --build -d 2>&1 | \
        grep -E "Created|Started|Healthy|Error|error" || true
fi

# ── 3. Wait for services to be healthy ──────────────────────────────────────
echo ""
log "Waiting for services to become healthy..."

MAX_WAIT=120
ELAPSED=0
INTERVAL=5

# Wait for backend health
printf "  Backend API: "
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
        printf "${GREEN}READY${NC} (%ds)\n" $ELAPSED
        break
    fi
    printf "."
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done
if [ $ELAPSED -ge $MAX_WAIT ]; then
    printf "${RED}TIMEOUT${NC}\n"
    err "Backend failed to start within ${MAX_WAIT}s."
    info "Check logs: docker compose logs backend"
    exit 1
fi

# Wait for frontend
printf "  Frontend:    "
ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    if curl -sk https://localhost/ >/dev/null 2>&1; then
        printf "${GREEN}READY${NC} (%ds)\n" $ELAPSED
        break
    fi
    printf "."
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done
if [ $ELAPSED -ge $MAX_WAIT ]; then
    printf "${RED}TIMEOUT${NC}\n"
    warn "Frontend may still be starting. Check: docker compose logs frontend"
fi

# ── 4. Verify login works ──────────────────────────────────────────────────
echo ""
log "Verifying authentication..."
LOGIN_RESPONSE=$(curl -s http://localhost:8000/api/v1/auth/login \
    -X POST -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' 2>/dev/null || echo "{}")

if echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('token')" 2>/dev/null; then
    info "Login: ${GREEN}OK${NC} (admin user authenticated)"
else
    warn "Login verification failed. Seed users may not have been created."
    info "Check that ENV_MODE=development is set in docker-compose.yml"
    info "Logs: docker compose logs backend | grep -i seed"
fi

# ── 5. Print access information ─────────────────────────────────────────────
echo ""
header "KEYSTONE is Ready"

cat <<EOF
  ${BOLD}Application${NC}
    Frontend:   ${CYAN}https://localhost${NC}  (accept the self-signed certificate)
    API Docs:   ${CYAN}http://localhost:8000/docs${NC}

  ${BOLD}Default Credentials${NC}
    admin / admin123         System Administrator
    commander / cmd123       Battalion Commander
    s4officer / s4pass123    S-4 Logistics Officer
    s3officer / s3pass123    S-3 Operations Officer
    operator / op123         Logistics Operator
    armorer / arm123         Unit Armorer
    viewer / view123         Read-Only Viewer

  ${BOLD}Quick Commands${NC}
    View logs:     docker compose logs -f
    Stop:          ./install.sh --stop
    Reset:         ./install.sh --reset
    Status:        ./install.sh --status

EOF

if [ "$DEMO" = true ]; then
    info "Simulator is running. Live data will appear in ~30 seconds."
fi

log "Done. Open ${CYAN}https://localhost${NC} in your browser."
