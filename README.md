# Project 2

This folder is the complete Kubernetes and React CI/CD submission. It includes:

- The React/Vite application and its Docker/nginx build in [`app/`](./app/).
- The Jenkins pipeline in [`Jenkinsfile`](./Jenkinsfile).
- Kubernetes Deployment, Service, Ingress, and production Kustomize overlay in [`gitops/`](./gitops/).
- Kubespray-based AWS cluster automation and add-ons in [`kubernetes/`](./kubernetes/).

Start with [`kubernetes/README.md`](./kubernetes/README.md) for AWS setup, cluster provisioning, add-on installation, and Jenkins/Argo CD configuration. Set AWS and cluster-specific values in [`kubernetes/vars.yml`](./kubernetes/vars.yml) and shared values in [`group_vars/all.yml`](./group_vars/all.yml). Keep AWS credentials and password hashes in environment variables.

Nothing is provisioned automatically. The deployment playbook creates billable AWS resources only when you explicitly run it.
