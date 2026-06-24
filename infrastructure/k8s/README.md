# Kubernetes Manifests

This directory contains Kubernetes resources for deploying the Waybill Tracking system.

## Secret Management

The `secrets.yaml` file in this directory is a **template only** and contains placeholder values. It must not be committed with real credentials.

### Recommended approaches for production

#### 1. Sealed Secrets (Bitnami)

Sealed Secrets let you encrypt secrets so they can be stored safely in Git.

```bash
# Install the Sealed Secrets controller (do this once per cluster)
helm install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace sealed-secrets --create-namespace

# Create a regular secret and pipe it through kubeseal
kubectl create secret generic waybill-secrets \
  --from-literal=database-url="postgres://user:password@postgres:5432/waybill?sslmode=disable" \
  --from-literal=analytics-database-url="postgres://user:password@postgres:5432/waybill?sslmode=disable" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --from-literal=db-user="waybill" \
  --from-literal=db-password="$(openssl rand -base64 32)" \
  --namespace waybill --dry-run=client -o yaml | \
  kubeseal --controller-namespace=sealed-secrets -o yaml > waybill-sealed-secrets.yaml

kubectl apply -f waybill-sealed-secrets.yaml
```

See `sealed-secrets.yaml.example` for the manifest structure.

#### 2. External Secrets Operator (ESO)

Store secrets in an external provider (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, HashiCorp Vault) and sync them into Kubernetes.

Example `ExternalSecret`:

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: waybill-secrets
  namespace: waybill
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: waybill-secrets
  data:
    - secretKey: database-url
      remoteRef:
        key: waybill/database-url
    - secretKey: jwt-secret
      remoteRef:
        key: waybill/jwt-secret
```

#### 3. SOPS + Flux/ArgoCD

Encrypt `secrets.yaml` with [Mozilla SOPS](https://github.com/getsops/sops) and decrypt it during GitOps deployment.

#### 4. Manual (not recommended for production)

Copy `secrets.yaml.example` to `secrets.yaml`, replace the placeholders with base64-encoded values, and apply:

```bash
cp secrets.yaml.example secrets.yaml
# Edit secrets.yaml and replace placeholders
kubectl apply -f secrets.yaml
```

### Rotating Secrets

- `jwt-secret`: rotate immediately after first deployment. All issued JWTs will be invalidated, so users must sign in again.
- `db-password`: rotate through PostgreSQL, then update the secret and restart the affected pods.
- `database-url` and `analytics-database-url`: update when the database endpoint or credentials change.
