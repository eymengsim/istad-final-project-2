# Kubernetes with Kubespray

This is a separate deployment from the existing Jenkins/SonarQube/Nexus EC2 stack. It creates a three-control-plane, three-worker Kubernetes cluster across three AWS Availability Zones, installs the cluster with Kubespray, then deploys Traefik, cert-manager, Headlamp, and Argo CD. It also creates an AWS Network Load Balancer for the Kubernetes API and ingress.

## 1. Install the Ansible collections

From the `project2` directory, activate the Ansible environment and install the pinned AWS collections:

```bash
source ../ansible-venv/bin/activate
ansible-galaxy collection install -r kubernetes/requirements.yml
```

The controller needs AWS credentials with permission to manage EC2 instances, security groups, target groups, Network Load Balancers, and (optionally) Route 53 records. The SSH private key referenced by `group_vars/all.yml` must already exist.

## 2. Configure the AWS network and cluster

Edit [`vars.yml`](./vars.yml). Set:

- `k8s_ami_id` to a supported Ubuntu AMI in the configured AWS region.
- `k8s_admin_cidr` to the administrator's public IP range, preferably a single `/32`.
- `k8s_vpc_cidr` to the CIDR of the VPC.
- `k8s_subnet_ids` to exactly three subnets in that VPC, each in a different Availability Zone.
- `k8s_route53_zone_id` only if the cluster domains are in a Route 53 hosted zone. Set the Headlamp and Argo CD domain names to names in that zone.

The inherited `region`, `vpc_id`, `key_name`, and SSH key path come from [`../group_vars/all.yml`](../group_vars/all.yml). Each node gets a public IP for SSH; SSH and the Kubernetes API are limited to `k8s_admin_cidr`. Kubernetes nodes use `t3.medium` by default. AWS charges for six instances, EBS volumes, and the Network Load Balancer for as long as they remain provisioned.

## 3. Provision and install Kubernetes

Review the variables and the AWS changes, then run:

```bash
ansible-playbook -i kubernetes/inventory/local.yml kubernetes/provision.yml
```

The playbook validates that the subnets span three Availability Zones, provisions the six nodes and load balancer, writes an ignored Kubespray inventory, installs the pinned Kubespray release in a local virtual environment, bootstraps the cluster, and saves the admin kubeconfig under the ignored `kubernetes/artifacts/` directory.

The Network Load Balancer DNS name is printed during provisioning. If Route 53 is configured, the playbook creates CNAMEs for Headlamp and Argo CD. Otherwise create DNS CNAME records for both configured domains pointing to that load balancer. DuckDNS does not support CNAME records; use a DNS provider that does, or change the DNS design before relying on the domains.

## 4. Set secrets and install cluster add-ons

Set the Let's Encrypt email and Argo CD admin password hash in the environment. Generate a bcrypt hash interactively using the virtual environment created in step 3:

```bash
kubernetes/.cache/venv/bin/python -c 'from getpass import getpass; from passlib.hash import bcrypt; print(bcrypt.using(rounds=12, ident="2a").hash(getpass()))'
```

Export the resulting hash (not the plaintext password) as `ARGOCD_ADMIN_PASSWORD_HASH`, and set `LE_EMAIL`. Then install the add-ons:

```bash
export ARGOCD_ADMIN_PASSWORD_HASH='<bcrypt-hash>'
export LE_EMAIL='you@example.com'
export GITOPS_REPO_URL='https://github.com/<your-account>/<your-project2-repository>.git'
ansible-playbook -i kubernetes/inventory/local.yml kubernetes/addons.yml
```

The names and domain variables are in `kubernetes/vars.yml`. DNS must resolve to the Network Load Balancer before Let's Encrypt can issue certificates.

## 5. Configure the React GitOps deployment

The React app, [`Jenkinsfile`](../Jenkinsfile), and GitOps manifests are all part of this project. Push this `project2` directory as the root of your GitHub repository, and configure the Jenkins job to build that repository and its `main` branch. Set `GITOPS_REPO_URL` to the HTTPS URL of that same repository before installing the add-ons, as shown in step 4.

Argo CD tracks the same repository at `gitops/k8s/overlays/prod`. Before syncing, replace `reactjs-app.example.com` in [`../gitops/k8s/base/ingress.yaml`](../gitops/k8s/base/ingress.yaml) with the React app's DNS name and point that name at the cluster's Network Load Balancer.

Configure Jenkins with:

- `dockerhub-creds`: Docker Hub username/password permitted to push `mengsim/reactjs-app` (or update `IMAGE_NAME` in the Jenkinsfile to your image).
- `gitops-write-token`: a Git username/password credential that can push to the same repository's `main` branch.
- An agent with Node.js 20.19+ / npm, Docker, the Docker Pipeline plugin, and the Git plugin (including `gitUsernamePassword`).
- The configured `shared-lib` with the existing Sonar scan and Telegram notification steps.

The Jenkins pipeline builds `app/`, pushes an image tagged with the build number, then commits the image tag change to `gitops/k8s/overlays/prod/kustomization.yaml` in the checked-out repository. Argo CD detects that commit and reconciles the Kubernetes Deployment. GitOps-only commits skip the build and image-push stages to prevent a pipeline feedback loop. If using another image repository, update `IMAGE_NAME` in the Jenkinsfile and image names in the manifests together.

## 6. Verify and tear down

Verify the cluster and add-ons:

```bash
KUBECONFIG=kubernetes/artifacts/kubeconfig "$HOME/.local/bin/kubectl" get nodes
KUBECONFIG=kubernetes/artifacts/kubeconfig "$HOME/.local/bin/kubectl" get pods -A
```

Use the configured Headlamp and Argo CD domains after DNS propagation and certificate issuance. To delete only resources tagged for this Kubernetes cluster, review the target names and run:

```bash
ansible-playbook -i kubernetes/inventory/local.yml kubernetes/destroy.yml -e confirm_k8s_destroy=true
```

This deletes the tagged instances, load balancer, target groups, security group, and optional Route 53 records. It does not remove the SSH key pair or the existing project stack.
