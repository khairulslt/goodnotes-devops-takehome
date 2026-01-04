# Goodnotes DevOps Take-Home Assignment

This repository contains my submission for the Goodnotes DevOps take-home challenge.

The solution demonstrates how a pull request can automatically provision a multi-node Kubernetes cluster, deploy workloads behind an ingress, generate traffic, and report results back to the pull request using GitHub Actions.

---

## Overview

For every pull request to the default branch (`main`), the CI workflow performs the following:

1. Provisions a **multi-node Kubernetes cluster** using KinD
2. Deploys **Ingress-NGINX** as the ingress controller
3. Deploys two workloads:
   - `foo` → returns `foo`
   - `bar` → returns `bar`
4. Configures ingress routing:
   - `foo.localhost` → `foo`
   - `bar.localhost` → `bar`
5. Validates cluster, ingress, and application readiness
6. Generates randomized HTTP traffic using **k6**
7. Captures latency, failure rate, and throughput metrics
8. Posts the load test summary as a **comment on the pull request**

---

## Time Spent

Approximately **4–5 hours**, including:
- CI workflow design and iteration
- Kubernetes + ingress setup
- Load testing and reporting
- Defensive error handling and debugging
- README.md

---

## CI Workflow Design

The GitHub Actions workflow is intentionally kept linear to make execution order and failure points easy to follow.

- Each step validates readiness before proceeding
- Failures stop the workflow early with relevant debug output
- Reporting is treated as best-effort and does not block the job

The goal is correctness and observability rather than maximum parallelism.

---

## Kubernetes Setup

- Cluster is provisioned using KinD with **two nodes** (control plane + worker)
- Ingress-NGINX is deployed using the KinD-specific manifest
- Applications are deployed as standard Kubernetes `Deployment` + `Service`
- Ingress routing is configured via host-based rules

Ingress traffic is validated using `Host` headers against `127.0.0.1`, enabled through KinD port mappings.

---

## Load Testing

Traffic is generated using **k6** with the following characteristics:

- 20 virtual users
- 30-second test duration
- Requests randomly target `foo` or `bar`
- Validation ensures correct backend responses

The load test reports:
- Total requests
- Failure rate
- Latency (avg, p90, p95)
- Requests per second (req/s)

A summary is generated at the end of the test and posted directly to the pull request.

---

## Validation & Failure Handling

- Cluster readiness is validated using `kubectl wait`
- Application readiness is validated using `kubectl rollout status`
- Ingress routing is validated via repeated HTTP checks
- On failure, the workflow prints relevant pod state, events, and logs to make issues easier to diagnose from CI alone.

The PR comment step is guarded so missing tooling or output does not fail the workflow.

---

## Stretch Goal: Deploying Monitoring Solution

- Metrics Server is deployed to allow resource sampling via `kubectl top`
- Resource usage is sampled before, during, and after load testing

A full Prometheus setup was intentionally avoided, as it would add significant setup and operational overhead beyond what’s needed to demonstrate the stretch goal within the time constraint.

---

## Assumptions & Trade-offs

- **End-to-end correctness over production observability**  
  The workflow prioritizes validating the full request lifecycle and measurable behavior in CI. Load and latency are captured using k6, and resource usage is sampled via metrics-server, rather than deploying a full Prometheus stack that would introduce operational complexity that wouldn’t meaningfully improve signal for this task.

- **Single self-contained CI job over modular pipelines**  
  The workflow is implemented as a single GitHub Actions job so that cluster provisioning, readiness checks, ingress validation, load testing, and PR reporting are visible end-to-end in one place. In a production environment, this logic would typically be decomposed into reusable scripts or shared workflows and executed against persistent or ephemeral clusters to improve reuse and overall execution speed.

- **Explicit configuration over abstraction**  
  Configuration is written explicitly instead of being abstracted behind templates or helper scripts. While repetition could be reduced with parameterization or shared tooling, the current approach favors readability, traceability, and ease of review within a CI-driven take-home assignment.