# Kubernetes Migration Plan

This document outlines the architecture and step-by-step execution plan for migrating the MealMate Docker Compose infrastructure to Kubernetes. It uses **Kustomize** for application workloads, **Helm** for infrastructure/observability, and **GitHub Actions** for CI/CD with K8s validation.

---

## 1. Architecture Overview (Hybrid Kustomize + Helm)

### Core Separation Strategy:

* **Custom Application Code (Backend, Frontend, DB, Ingress rules):** Managed with **Kustomize** (clean, zero-templating, declarative).
* **Third-Party Infrastructure (Observability & Networking):** Managed with **Helm** (industry-standard, pre-packaged).

```text
k8s/
├── base/
│   ├── kustomization.yaml
│   ├── data/
│   │   ├── postgres-pvc.yaml
│   │   ├── postgres-config.yaml
│   │   ├── postgres-secret.yaml
│   │   ├── postgres-deployment.yaml      # Deployment & Service
│   │   └── redis-deployment.yaml         # Deployment & Service
│   ├── apps/
│   │   ├── backend-config.yaml
│   │   ├── backend-secret.yaml
│   │   ├── backend-deployment.yaml       # Deployment & Service (with health probes)
│   │   ├── frontend-config.yaml
│   │   └── frontend-deployment.yaml      # Deployment & Service (with health probes)
│   └── network/
│       └── ingress.yaml                  # Routing rules (mealmate.local, api, grafana)
│
├── overlays/
│   ├── local/
│   │   └── kustomization.yaml            # Local dev patches (imagePullPolicy: Never)
│   └── prod/
│       └── kustomization.yaml            # Production patches (Docker Hub images, prod URLs)
│
└── helm/                                 # Helm values configurations
    ├── ingress-nginx-values.yaml         # Ingress controller settings
    ├── prometheus-stack-values.yaml      # Lightweight Prometheus + Grafana config
    └── loki-stack-values.yaml            # Loki + Promtail log collection config
```

---

## 2. CI/CD Deployment Pipeline (GitHub Actions)

The CI/CD pipeline will be updated to include Kubernetes manifest validation and automated deployment.

### Pipeline Steps (`.github/workflows/ci.yml`):

1. **Test & Build:**
   - Run unit and E2E tests.
   - Build Docker images and push to Docker Hub with Git SHA tags: `yourusername/mealmate-backend:${{ github.sha }}`.
2. **K8s Tier 1 Validation (Dry-Run):**
   - Run `kubectl apply --dry-run=client -k k8s/overlays/prod` in CI to instantly catch YAML typos, indentation errors, or missing config references before deployment.
3. **Deploy to VPS (CD):**
   - Use `sed` or `kustomize edit set image` to dynamically update the image tag in `k8s/overlays/prod/kustomization.yaml`.
   - Securely connect to the VPS cluster using a `KUBECONFIG` GitHub secret.
   - Run `kubectl apply -k k8s/overlays/prod` remotely to trigger zero-downtime rolling updates.

---

## 3. Execution Playbook: Local Development

Follow these steps from start to finish to run the Kubernetes cluster locally.

### Step 3.1: Enable Kubernetes in Docker Desktop

1. Open **Docker Desktop**.
2. Click the **Gear icon (Settings)** at the top right.
3. Select **Kubernetes** from the left menu.
4. Check **"Enable Kubernetes"** and click **Apply & restart**.
5. Wait for the Kubernetes icon to turn **Green**.
6. Verify via PowerShell: `kubectl get nodes` (Should say `docker-desktop Ready`).

### Step 3.2: Install Infrastructure Tools (Helm & Ingress)

1. Install Helm on your machine (PowerShell):
   ```powershell
   winget install Helm.Helm
   ```
2. Install the NGINX Ingress Controller (essential for routing traffic to `mealmate.local`):
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```
3. Add Helm Repositories for Observability:
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm repo add grafana https://grafana.github.io/helm-charts
   helm repo update
   ```

### Step 3.3: Deploy Local Application

1. **Build Local Images (tagged as 'local'):**
   ```bash
   docker build -t mealmate-backend:local ./backend
   docker build -t mealmate-frontend:local ./frontend
   ```
2. **Apply App Workloads (Kustomize):**
   ```bash
   kubectl apply -k k8s/overlays/local
   ```
3. **Deploy Observability Stack (Helm):**
   *Uses custom `values.yaml` files to cap memory usage on your laptop.*
   ```bash
   helm upgrade --install prometheus prometheus-community/kube-prometheus-stack -f k8s/helm/prometheus-stack-values.yaml
   helm upgrade --install loki grafana/loki-stack -f k8s/helm/loki-stack-values.yaml
   ```

---

## 4. Execution Playbook: Production Setup

When you are ready to deploy this to your real VPS:

### Step 4.1: VPS Preparation

1. Install a lightweight Kubernetes distribution on your VPS (e.g., **K3s** or **MicroK8s**).
2. Install Cert-Manager via Helm on the VPS to handle automated Let's Encrypt SSL certificates.

### Step 4.2: CI/CD Secret Configuration

1. Grab the Kubeconfig file from your VPS (`/etc/rancher/k3s/k3s.yaml` or `~/.kube/config`).
2. Go to your GitHub Repository -> Settings -> Secrets and Variables -> Actions.
3. Add the following secrets:
   - `KUBECONFIG` (Paste the contents of your VPS config, replacing `127.0.0.1` with the VPS public IP).
   - `DOCKER_USERNAME` (Your Docker Hub username).
   - `DOCKER_PASSWORD` (Your Docker Hub access token).

### Step 4.3: Deploy

1. Push your code to the `main` branch.
2. The GitHub Actions pipeline will validate the YAML, build the images, push them to Docker Hub, and remotely instruct your VPS to pull and run them.
