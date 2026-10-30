@Library('shared-lib') _

pipeline {
    agent any
    options {
        disableConcurrentBuilds()
    }
    environment {
        IMAGE_NAME = 'docker.io/mengsim/reactjs-app'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        GITOPS_BRANCH = 'main'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Build and verify') {
            when {
                not {
                    changeset 'gitops/k8s/overlays/prod/kustomization.yaml'
                }
            }
            steps {
                dir('app') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }
        stage('Sonar Scan') {
            when {
                not {
                    changeset 'gitops/k8s/overlays/prod/kustomization.yaml'
                }
            }
            steps {
                scanSonarqube('reactjs-app')
            }
        }
        stage('Build and push image') {
            when {
                not {
                    changeset 'gitops/k8s/overlays/prod/kustomization.yaml'
                }
            }
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub-creds') {
                        def image = docker.build("${IMAGE_NAME}:${IMAGE_TAG}", '-f app/Dockerfile app')
                        image.push()
                    }
                }
            }
        }
        stage('Promote through GitOps') {
            when {
                not {
                    changeset 'gitops/k8s/overlays/prod/kustomization.yaml'
                }
            }
            steps {
                withCredentials([gitUsernamePassword(
                    credentialsId: 'gitops-write-token',
                    gitToolName: 'Default'
                )]) {
                    sh '''
                        set -eu
                        git fetch origin "${GITOPS_BRANCH}"
                        git checkout -B gitops-update "origin/${GITOPS_BRANCH}"
                        sed -i "s/^  newTag: .*/  newTag: \"${IMAGE_TAG}\"/" gitops/k8s/overlays/prod/kustomization.yaml
                        git config user.name "Jenkins"
                        git config user.email "jenkins@localhost"
                        git add gitops/k8s/overlays/prod/kustomization.yaml
                        if ! git diff --cached --quiet; then
                            git commit -m "Deploy reactjs-app ${IMAGE_TAG}"
                            git push origin "HEAD:${GITOPS_BRANCH}"
                        fi
                    '''
                }
            }
        }
    }
    post {
        success {
            sendTelegram("✅ Jenkins pipeline completed: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
            echo 'Argo CD reconciles application-image updates committed by Jenkins.'
        }
        failure {
            sendTelegram("❌ Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}")
            echo "Build or GitOps promotion failed for ${env.JOB_NAME} #${env.BUILD_NUMBER}."
        }
    }
}
