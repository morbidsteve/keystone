# Kubernetes / Helm Deployment

This guide covers deploying KEYSTONE on Kubernetes using Helm charts.

---

## Prerequisites

| Requirement         | Minimum Version |
|---------------------|----------------|
| Kubernetes cluster  | 1.27+          |
| Helm                | 3.12+          |
| kubectl             | 1.27+          |
| Container registry  | Any OCI-compliant |
| Storage provisioner | For PVCs (PostgreSQL data) |

---

## Helm Chart Structure

The KEYSTONE Helm chart is located in `charts/ems-cop/`:

```
charts/ems-cop/
  Chart.yaml           # Chart metadata and version
  values.yaml          # Default configuration values
  templates/
    deployment.yaml    # Backend API deployment
    service.yaml       # ClusterIP services
    ingress.yaml       # Ingress resource
    configmap.yaml     # Environment configuration
    secret.yaml        # Sensitive values
    pvc.yaml           # Persistent volume claims
    hpa.yaml           # Horizontal Pod Autoscaler
    celery-deployment.yaml  # Celery worker deployment
    frontend-deployment.yaml # Frontend (nginx) deployment
```

---

## Quick Start

### 1. Add Container Images

Push KEYSTONE images to your cluster's container registry:

```bash
# Build images
docker compose build

# Tag for your registry
docker tag keystone-backend:latest registry.example.com/keystone/backend:latest
docker tag keystone-frontend:latest registry.example.com/keystone/frontend:latest

# Push
docker push registry.example.com/keystone/backend:latest
docker push registry.example.com/keystone/frontend:latest
```

### 2. Install with Helm

```bash
# Create namespace
kubectl create namespace keystone

# Install with default values
helm install keystone charts/ems-cop/ \
  --namespace keystone \
  --set backend.image.repository=registry.example.com/keystone/backend \
  --set frontend.image.repository=registry.example.com/keystone/frontend \
  --set postgresql.auth.password=STRONG_PASSWORD \
  --set backend.secretKey=GENERATED_SECRET_KEY

# Check deployment status
kubectl -n keystone get pods
helm -n keystone status keystone
```

### 3. Upgrade

```bash
helm upgrade keystone charts/ems-cop/ \
  --namespace keystone \
  --reuse-values \
  --set backend.image.tag=v0.2.0
```

### 4. Uninstall

```bash
helm uninstall keystone --namespace keystone
# Note: PVCs are retained by default. Delete manually if needed:
kubectl -n keystone delete pvc --all
```

---

## values.yaml Key Configuration

```yaml
# -- Global settings
global:
  environment: production

# -- Backend API
backend:
  image:
    repository: ghcr.io/morbidsteve/keystone-backend
    tag: latest
    pullPolicy: IfNotPresent
  replicas: 2
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 2000m
      memory: 2Gi
  secretKey: ""              # REQUIRED: JWT signing key
  envMode: production
  corsOrigins: '["https://keystone.example.com"]'

# -- Celery Worker
celery:
  replicas: 2
  resources:
    requests:
      cpu: 250m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  concurrency: 4

# -- Frontend (nginx)
frontend:
  image:
    repository: ghcr.io/morbidsteve/keystone-frontend
    tag: latest
    pullPolicy: IfNotPresent
  replicas: 2
  resources:
    requests:
      cpu: 100m
      memory: 64Mi
    limits:
      cpu: 500m
      memory: 256Mi

# -- PostgreSQL (sub-chart or external)
postgresql:
  enabled: true              # Set false to use external database
  auth:
    username: keystone
    password: ""             # REQUIRED
    database: keystone
  primary:
    persistence:
      size: 50Gi
      storageClass: ""       # Use cluster default
  image:
    repository: postgis/postgis
    tag: "15-3.4"

# -- Redis (sub-chart or external)
redis:
  enabled: true              # Set false to use external Redis
  auth:
    enabled: false
  master:
    persistence:
      size: 5Gi

# -- External database (when postgresql.enabled=false)
externalDatabase:
  host: ""
  port: 5432
  user: keystone
  password: ""
  database: keystone

# -- External Redis (when redis.enabled=false)
externalRedis:
  host: ""
  port: 6379

# -- Ingress
ingress:
  enabled: true
  className: nginx           # or "traefik"
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: keystone.example.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend
  tls:
    - secretName: keystone-tls
      hosts:
        - keystone.example.com

# -- Horizontal Pod Autoscaler
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

---

## Horizontal Pod Autoscaler

KEYSTONE supports HPA for the backend API and Celery workers:

```yaml
# templates/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Release.Name }}-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Release.Name }}-backend
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
```

Verify HPA is working:

```bash
kubectl -n keystone get hpa
kubectl -n keystone describe hpa keystone-backend
```

---

## Persistent Volume Claims

PostgreSQL requires persistent storage:

```yaml
# templates/pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ .Release.Name }}-postgresql-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ .Values.postgresql.primary.persistence.size }}
  storageClassName: {{ .Values.postgresql.primary.persistence.storageClass | default "" }}
```

### Storage Class Recommendations

| Provider          | Storage Class            | Notes                    |
|-------------------|--------------------------|--------------------------|
| AWS EKS           | `gp3`                   | General purpose SSD      |
| Azure AKS         | `managed-premium`       | Premium SSD              |
| GCP GKE           | `premium-rwo`           | SSD persistent disk      |
| On-prem (Rook)    | `rook-ceph-block`       | Ceph block storage       |
| On-prem (Longhorn)| `longhorn`              | Lightweight distributed  |

---

## Ingress Configuration

### Nginx Ingress Controller

```bash
# Install nginx-ingress
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

### Traefik Ingress Controller

```bash
# Install Traefik
helm repo add traefik https://traefik.github.io/charts
helm install traefik traefik/traefik \
  --namespace traefik --create-namespace
```

Update `values.yaml`:

```yaml
ingress:
  className: traefik
  annotations:
    traefik.ingress.kubernetes.io/router.tls: "true"
```

---

## Secrets Management

### Option A: Kubernetes Secrets (Default)

```bash
kubectl -n keystone create secret generic keystone-secrets \
  --from-literal=secret-key=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))") \
  --from-literal=database-password=STRONG_PASSWORD
```

### Option B: External Secrets Operator

For production, use the External Secrets Operator to sync from a secrets manager:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: keystone-secrets
  namespace: keystone
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager    # or vault, azure-kv, gcp-sm
    kind: ClusterSecretStore
  target:
    name: keystone-secrets
  data:
    - secretKey: secret-key
      remoteRef:
        key: keystone/production
        property: SECRET_KEY
    - secretKey: database-password
      remoteRef:
        key: keystone/production
        property: DB_PASSWORD
```

### Option C: HashiCorp Vault

```bash
# Install Vault Agent Injector
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault \
  --set "injector.enabled=true" \
  --namespace vault --create-namespace
```

Add annotations to the backend deployment:

```yaml
annotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/agent-inject-secret-config: "secret/data/keystone"
  vault.hashicorp.com/role: "keystone"
```

---

## Monitoring (Prometheus + Grafana)

### Install Monitoring Stack

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
```

### Backend Metrics

KEYSTONE exposes health endpoints that can be scraped:

```yaml
# ServiceMonitor for backend
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: keystone-backend
  namespace: keystone
spec:
  selector:
    matchLabels:
      app: keystone-backend
  endpoints:
    - port: http
      path: /health
      interval: 15s
```

### Recommended Alerts

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: keystone-alerts
  namespace: keystone
spec:
  groups:
    - name: keystone
      rules:
        - alert: KeystoneBackendDown
          expr: up{job="keystone-backend"} == 0
          for: 2m
          labels:
            severity: critical
          annotations:
            summary: "KEYSTONE backend is down"

        - alert: KeystoneHighLatency
          expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="keystone-backend"}[5m])) > 2
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "KEYSTONE API p95 latency exceeds 2s"

        - alert: KeystonePodRestarting
          expr: increase(kube_pod_container_status_restarts_total{namespace="keystone"}[1h]) > 3
          for: 0m
          labels:
            severity: warning
          annotations:
            summary: "KEYSTONE pod restarting frequently"
```

### Grafana Dashboard

Import the Kubernetes pod monitoring dashboard (ID: 15760) and filter by
namespace `keystone` to get pod-level CPU, memory, and network metrics.

---

## Useful kubectl Commands

```bash
# View all resources
kubectl -n keystone get all

# View pod logs
kubectl -n keystone logs -f deployment/keystone-backend

# Execute into a pod
kubectl -n keystone exec -it deployment/keystone-backend -- /bin/sh

# Port-forward for local access
kubectl -n keystone port-forward svc/keystone-backend 8000:8000

# Scale manually
kubectl -n keystone scale deployment/keystone-backend --replicas=4

# View events (troubleshooting)
kubectl -n keystone get events --sort-by='.lastTimestamp'

# Check resource usage
kubectl -n keystone top pods
```
