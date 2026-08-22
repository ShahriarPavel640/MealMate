# Kubernetes Migration Plan

This document outlines the architecture and steps for migrating the MealMate Docker Compose infrastructure to Kubernetes.

## 1. Architecture Overview

The application will be divided into the following logical components within Kubernetes:

### 1.1 Data Layer (`k8s/data/`)
- **PostgreSQL (PostGIS):** 
  - `postgres-pvc.yaml`: PersistentVolumeClaim to persist database data.
  - `postgres-config.yaml`: ConfigMap containing the database initialization scripts (`1-schema.sql`, `2-seed.sql`).
  - `postgres-secret.yaml`: Secret to securely store the `POSTGRES_PASSWORD`.
  - `postgres-deployment.yaml`: Deployment to manage the Postgres pod and a ClusterIP Service for internal networking.
- **Redis:**
  - `redis-deployment.yaml`: Deployment and ClusterIP Service.
- **pgAdmin:** (Optional developer tool)
  - `pgadmin-deployment.yaml`: Deployment and Service to access the DB GUI.

### 1.2 Application Layer (`k8s/apps/`)
- **Backend:**
  - `backend-config.yaml`: ConfigMap for non-sensitive environment variables (`PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `REDIS_URL`, `FRONTEND_URL`, `BACKEND_URL`).
  - `backend-secret.yaml`: Secrets for sensitive data (`DB_PASSWORD`, `SENTRY_DSN`, `JWT_SECRET`, `CLOUDINARY_API_SECRET`, `SSL_COMMERZ_STORE_ID`, `SSL_COMMERZ_STORE_PASSWORD`, `GOOGLE_API_KEY`).
  - `backend-deployment.yaml`: Deployment to run the backend API and a ClusterIP Service.
- **Frontend:**
  - `frontend-config.yaml`: ConfigMap for frontend variables (`VITE_API_URL`, `VITE_SENTRY_DSN`).
  - `frontend-deployment.yaml`: Deployment to run the Vite frontend and a ClusterIP Service.

### 1.3 Observability Layer (`k8s/observability/`)
- **Prometheus:** Deployment, Service, ConfigMap for `prometheus.yml`, and a PVC for metric retention.
- **Loki:** Deployment, Service, ConfigMap for `loki-config.yaml`, and a PVC for log retention.
- **Promtail:** DaemonSet to automatically collect logs from all nodes/pods in the cluster and forward them to Loki.
- **Grafana:** Deployment, Service, PVC, and ConfigMaps for automated datasource and dashboard provisioning.

### 1.4 Networking (`k8s/network/`)
- **Ingress Controller (NGINX):**
  - `ingress.yaml`: Defines routing rules to map a local domain (e.g., `mealmate.local`) to the respective services:
    - `mealmate.local/api` ➔ Backend Service
    - `mealmate.local/` ➔ Frontend Service
    - `grafana.mealmate.local/` ➔ Grafana Service

## 2. Prerequisites

1. **Docker Desktop:** Ensure Kubernetes is enabled in Docker Desktop settings.
2. **NGINX Ingress Controller:** Install the Ingress controller to your local cluster:
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```
3. **Local Domain Mapping:** Update your local hosts file (e.g., `C:\Windows\System32\drivers\etc\hosts`) to map the local domains to localhost:
   ```text
   127.0.0.1 mealmate.local
   127.0.0.1 grafana.mealmate.local
   ```

## 3. Deployment Steps

### Step 1: Build Local Images
Kubernetes needs images to run. Since we are using Docker Desktop, images built locally are available to the cluster immediately.
```bash
docker build -t mealmate-backend:latest ./backend
docker build -t mealmate-frontend:latest ./frontend
```

### Step 2: Apply Manifests
Apply the manifests in the following order to respect dependencies:
```bash
kubectl apply -f k8s/data/
kubectl apply -f k8s/apps/
kubectl apply -f k8s/observability/
kubectl apply -f k8s/network/
```

### Step 3: Verify Deployment
Check the status of all pods to ensure they are `Running`:
```bash
kubectl get pods -A
```

## 4. Teardown
To spin down the cluster and clean up resources:
```bash
kubectl delete -f k8s/network/
kubectl delete -f k8s/observability/
kubectl delete -f k8s/apps/
kubectl delete -f k8s/data/
```
