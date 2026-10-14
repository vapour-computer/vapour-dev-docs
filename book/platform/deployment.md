# Build and deploy the platform

**Availability: source-preview infrastructure and integrated web checkout.**
The source deploy script creates cloud resources and deploys API/web services.
Reading these instructions does not deploy them. The browser feature branch
alone does not contain the unpublished web Dockerfile/auth integration.

## Prerequisites

- Terraform 1.9+, gcloud, Docker, Git and curl.
- The implemented `vapour-infra` checkout and a matching integrated web checkout.
- The selected Google Cloud/Firebase project, appropriate account access and billing.
- A chosen Firestore data location and the intended regional service locations.

The repo layout has `modules/base`, `modules/region`, `modules/budget` and separate
`envs/staging`/`envs/prod` roots. Firestore's location is immutable after creation;
choose it before bootstrap. Production configuration enables Firestore deletion
protection and prevents destruction of a nonempty game bucket.

## 1. Configure staging

From `vapour-infra`:

```sh
cp infra/terraform/envs/staging/staging.tfvars.example infra/terraform/envs/staging/staging.tfvars
gcloud auth login
```

Fill in the intended project and Firebase web config in the local variable file.
Real `*.tfvars` are ignored; do not commit environment credentials or private
configuration. Enable Google sign-in manually in Firebase Auth and add the
actual web origin to authorized domains.

## 2. Validate before applying

```sh
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform/envs/staging init -backend=false
terraform -chdir=infra/terraform/envs/staging validate
bash -n scripts/bootstrap-tfstate.sh scripts/deploy.sh
```

Provider initialization can download provider packages; it does not deploy the
application. Review the selected project, regions and changes before applying.

## 3. Deploy

```sh
WEB_DIR=/path/to/integrated/vapour/apps/web scripts/deploy.sh staging
```

The default `WEB_DIR` is `../vapour/apps/web`. The script checks for its Dockerfile,
bootstraps a versioned state bucket, initializes the backend and creates the base,
budget and registries before deploying services. Initial empty-image handling is
targeted so it does not remove existing service resources.

It builds one API image and one web image, tags each from its **own repository
revision**, pushes regional tags, applies the image map and smoke-tests the
resulting URLs. A dirty web tree receives a distinct tag. Record both revisions;
a shared API-derived tag would miss web-only changes.

Terraform approval is interactive unless `AUTO_APPROVE=1`. Use that option only
in an intentional automation flow with the correct environment configuration.

## 4. Verify

The current deploy script checks `/home?limit=1` on the API and `/` on the web
service. It does not use `/healthz` on default Cloud Run hosts because that path
is reserved by the Cloud Run frontend. The local API health endpoint remains
useful in the emulator/Compose workflow.

Verify auth, project listing and a controlled game publication separately. Check
that `PUBLIC_BASE_URL` resolves to the API's `/play` routes, `WEB_BASE_URL` points
to the intended site and exact CORS origins match. Verify production telemetry
exclusion before any future integrated Devtools rollout.

## Regions and production

Update `regions` in the environment variable file, subject to its allowed-region
set, or pass an explicit region list to the deploy script. This is a desired
deployment set, not automatically an additive operation; inspect the Terraform plan.
Each region currently has independent API/web Cloud Run URLs. No global load
balancer is implemented by this source.

Production uses its own `envs/prod` configuration and `scripts/deploy.sh prod`.
Deploying the normal web/API stack must not copy staging collector artifacts or
activate a Devtools preference endpoint. See [guardrails](production-guardrails.md).
