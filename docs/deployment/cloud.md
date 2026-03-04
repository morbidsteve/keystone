# Cloud Deployment (AWS / Azure / GCP)

This guide covers deploying KEYSTONE on the three major cloud platforms using
managed container and database services.

---

## Architecture Overview

```
                    +-----------------+
                    |   CDN / WAF     |
                    | (CloudFront /   |
                    |  Azure CDN /    |
                    |  Cloud CDN)     |
                    +--------+--------+
                             |
                    +--------+--------+
                    | Load Balancer   |
                    | (ALB / App GW / |
                    |  Cloud LB)      |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     |  Frontend        |          |  Backend API    |
     |  (Static SPA)    |          |  (Container)    |
     |  S3/Blob/GCS     |          |  ECS/ACI/Run    |
     +------------------+          +--------+--------+
                                            |
                          +-----------------+-----------------+
                          |                                   |
                 +--------+--------+                 +--------+--------+
                 |  PostgreSQL     |                 |  Redis           |
                 |  (RDS / Azure   |                 |  (ElastiCache /  |
                 |   DB / Cloud    |                 |   Azure Cache /  |
                 |   SQL)          |                 |   Memorystore)   |
                 +-----------------+                 +-----------------+
```

All cloud deployments share the same container images from `ghcr.io/morbidsteve/keystone`.

---

## AWS Deployment

### Services Used

| Component        | AWS Service                  | Notes                      |
|-----------------|------------------------------|----------------------------|
| Frontend         | S3 + CloudFront              | Static SPA hosting         |
| Backend API      | ECS Fargate                  | Serverless containers      |
| Celery Worker    | ECS Fargate                  | Background task processing |
| Database         | RDS PostgreSQL 15 + PostGIS  | Managed PostgreSQL         |
| Cache            | ElastiCache Redis            | Managed Redis              |
| Load Balancer    | Application Load Balancer    | HTTPS termination          |
| Secrets          | AWS Secrets Manager          | Credential storage         |
| Container Images | ECR                          | Private registry           |

### Step-by-Step

#### 1. Push Images to ECR

```bash
# Create repositories
aws ecr create-repository --repository-name keystone/backend
aws ecr create-repository --repository-name keystone/frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker compose build
docker tag keystone-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/keystone/backend:latest
docker tag keystone-frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/keystone/frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/keystone/backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/keystone/frontend:latest
```

#### 2. Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier keystone-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15 \
  --master-username keystone \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 100 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxx \
  --db-name keystone
```

Enable PostGIS after creation:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### 3. Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id keystone-redis \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxx
```

#### 4. Store Secrets

```bash
aws secretsmanager create-secret \
  --name keystone/production \
  --secret-string '{
    "DATABASE_URL": "postgresql+asyncpg://keystone:PASSWORD@keystone-db.xxx.rds.amazonaws.com:5432/keystone",
    "REDIS_URL": "redis://keystone-redis.xxx.cache.amazonaws.com:6379/0",
    "SECRET_KEY": "GENERATED_SECRET_KEY"
  }'
```

#### 5. ECS Task Definition

```json
{
  "family": "keystone-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/keystone/backend:latest",
      "portMappings": [{ "containerPort": 8000 }],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:...keystone/production:DATABASE_URL::" },
        { "name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:...keystone/production:REDIS_URL::" },
        { "name": "SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:...keystone/production:SECRET_KEY::" }
      ],
      "environment": [
        { "name": "ENV_MODE", "value": "production" }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 15,
        "timeout": 5,
        "retries": 3
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/keystone",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### 6. Frontend on S3 + CloudFront

```bash
# Build frontend
cd frontend && npm ci && npm run build

# Create S3 bucket
aws s3 mb s3://keystone-frontend-prod

# Upload built assets
aws s3 sync dist/ s3://keystone-frontend-prod --delete

# Create CloudFront distribution with:
# - Origin: S3 bucket
# - Behaviors: /api/* -> ALB origin, /* -> S3 origin
# - Custom error response: 404 -> /index.html (SPA routing)
# - SSL certificate from ACM
```

---

## Azure Deployment

### Services Used

| Component        | Azure Service                          |
|-----------------|----------------------------------------|
| Frontend         | Azure Static Web Apps or Blob + CDN    |
| Backend API      | Azure Container Instances or App Service |
| Celery Worker    | Azure Container Instances              |
| Database         | Azure Database for PostgreSQL Flexible Server |
| Cache            | Azure Cache for Redis                  |
| Load Balancer    | Azure Application Gateway              |
| Secrets          | Azure Key Vault                        |
| Container Images | Azure Container Registry (ACR)         |

### Key Steps

#### 1. Push to ACR

```bash
az acr create --name keystoneacr --resource-group keystone-rg --sku Standard
az acr login --name keystoneacr

docker tag keystone-backend:latest keystoneacr.azurecr.io/keystone/backend:latest
docker push keystoneacr.azurecr.io/keystone/backend:latest
```

#### 2. Create PostgreSQL

```bash
az postgres flexible-server create \
  --resource-group keystone-rg \
  --name keystone-db \
  --admin-user keystone \
  --admin-password <STRONG_PASSWORD> \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 128 \
  --version 15
```

#### 3. Create Redis

```bash
az redis create \
  --resource-group keystone-rg \
  --name keystone-redis \
  --sku Basic \
  --vm-size C0
```

#### 4. Deploy to ACI

```bash
az container create \
  --resource-group keystone-rg \
  --name keystone-backend \
  --image keystoneacr.azurecr.io/keystone/backend:latest \
  --cpu 2 --memory 4 \
  --ports 8000 \
  --environment-variables ENV_MODE=production \
  --secure-environment-variables \
    DATABASE_URL="postgresql+asyncpg://..." \
    SECRET_KEY="..." \
    REDIS_URL="redis://..."
```

---

## GCP Deployment

### Services Used

| Component        | GCP Service                    |
|-----------------|--------------------------------|
| Frontend         | Cloud Storage + Cloud CDN      |
| Backend API      | Cloud Run                      |
| Celery Worker    | Cloud Run (always-on)          |
| Database         | Cloud SQL for PostgreSQL       |
| Cache            | Memorystore for Redis          |
| Load Balancer    | Cloud Load Balancing           |
| Secrets          | Secret Manager                 |
| Container Images | Artifact Registry (GCR)        |

### Key Steps

#### 1. Push to Artifact Registry

```bash
gcloud artifacts repositories create keystone \
  --repository-format=docker \
  --location=us-central1

docker tag keystone-backend:latest \
  us-central1-docker.pkg.dev/PROJECT_ID/keystone/backend:latest
docker push us-central1-docker.pkg.dev/PROJECT_ID/keystone/backend:latest
```

#### 2. Create Cloud SQL

```bash
gcloud sql instances create keystone-db \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-8192 \
  --region=us-central1 \
  --storage-size=100GB \
  --storage-auto-increase

gcloud sql databases create keystone --instance=keystone-db
gcloud sql users create keystone --instance=keystone-db --password=<STRONG_PASSWORD>
```

#### 3. Create Memorystore Redis

```bash
gcloud redis instances create keystone-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

#### 4. Deploy to Cloud Run

```bash
gcloud run deploy keystone-backend \
  --image us-central1-docker.pkg.dev/PROJECT_ID/keystone/backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars ENV_MODE=production \
  --set-secrets DATABASE_URL=keystone-db-url:latest,SECRET_KEY=keystone-secret:latest \
  --vpc-connector keystone-connector \
  --allow-unauthenticated
```

---

## Auto-Scaling Considerations

| Platform | Backend Scaling                      | Celery Scaling                          |
|----------|--------------------------------------|-----------------------------------------|
| AWS      | ECS Service auto-scaling (CPU/Memory) | ECS Service based on SQS queue depth    |
| Azure    | ACI doesn't auto-scale; use AKS for scaling | Scale via KEDA on AKS               |
| GCP      | Cloud Run auto-scales 0-N instances   | Cloud Run Jobs or GKE for workers       |

Recommended auto-scaling thresholds:
- Scale up at 70% CPU or 80% memory utilization
- Scale down after 5 minutes below 30% CPU
- Minimum 2 replicas for availability (backend API)
- Celery workers: scale based on Redis queue depth

---

## CDN for Static Assets

All cloud providers support CDN distribution for the frontend SPA:

- **AWS**: CloudFront with S3 origin
- **Azure**: Azure CDN with Blob Storage origin
- **GCP**: Cloud CDN with Cloud Storage backend

Configure cache headers:
- `index.html`: `Cache-Control: no-cache` (always fresh for SPA routing)
- `assets/*` (JS/CSS with hashes): `Cache-Control: public, max-age=31536000, immutable`

---

## Cost Estimates (Monthly)

| Tier         | Description                  | AWS (us-east-1) | Azure (East US) | GCP (us-central1) |
|-------------|------------------------------|------------------|-----------------|--------------------|
| **Small**   | Dev/test, single user        | ~$80             | ~$75            | ~$70               |
|             | 1 vCPU, 2GB RAM, 20GB DB    |                  |                 |                    |
| **Medium**  | Team of 10-50 users          | ~$250            | ~$240           | ~$220              |
|             | 2 vCPU, 4GB RAM, 100GB DB   |                  |                 |                    |
| **Large**   | Battalion+ (100-500 users)   | ~$600            | ~$580           | ~$550              |
|             | 4 vCPU, 8GB RAM, 500GB DB   |                  |                 |                    |
| **XL**      | Enterprise (500+ users)      | ~$1,500          | ~$1,400         | ~$1,300            |
|             | 8 vCPU, 16GB RAM, 1TB DB, HA|                  |                 |                    |

These estimates include compute, database, cache, storage, and data transfer.
Actual costs vary with usage patterns. Use the respective cloud provider's
pricing calculator for precise estimates.
