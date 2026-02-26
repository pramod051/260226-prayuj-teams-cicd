pipeline {
    agent any
    
    environment {
        AWS_REGION = 'ap-south-1'
        ECR_BACKEND_REPO = credentials('ecr-backend-repo-url')
        ECR_FRONTEND_REPO = credentials('ecr-frontend-repo-url')
        ECS_CLUSTER = credentials('ecs-cluster-name')
        ECS_BACKEND_SERVICE = 'prod-prayuj-backend-service'
        ECS_FRONTEND_SERVICE = 'prod-prayuj-frontend-service'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Backend') {
            steps {
                script {
                    dir('backend') {
                        sh 'docker build -f Dockerfile.prod -t prayuj-backend:${BUILD_NUMBER} .'
                    }
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                script {
                    dir('frontend') {
                        sh 'docker build -f Dockerfile.prod -t prayuj-frontend:${BUILD_NUMBER} .'
                    }
                }
            }
        }
        
        stage('Push to ECR') {
            steps {
                script {
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                        
                        docker tag prayuj-backend:${BUILD_NUMBER} ${ECR_BACKEND_REPO}:${BUILD_NUMBER}
                        docker tag prayuj-backend:${BUILD_NUMBER} ${ECR_BACKEND_REPO}:latest
                        docker push ${ECR_BACKEND_REPO}:${BUILD_NUMBER}
                        docker push ${ECR_BACKEND_REPO}:latest
                        
                        docker tag prayuj-frontend:${BUILD_NUMBER} ${ECR_FRONTEND_REPO}:${BUILD_NUMBER}
                        docker tag prayuj-frontend:${BUILD_NUMBER} ${ECR_FRONTEND_REPO}:latest
                        docker push ${ECR_FRONTEND_REPO}:${BUILD_NUMBER}
                        docker push ${ECR_FRONTEND_REPO}:latest
                    '''
                }
            }
        }
        
        stage('Deploy to ECS') {
            steps {
                script {
                    sh '''
                        aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_BACKEND_SERVICE} --force-new-deployment --region ${AWS_REGION}
                        aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_FRONTEND_SERVICE} --force-new-deployment --region ${AWS_REGION}
                    '''
                }
            }
        }
        
        stage('Wait for Deployment') {
            steps {
                script {
                    sh '''
                        aws ecs wait services-stable --cluster ${ECS_CLUSTER} --services ${ECS_BACKEND_SERVICE} --region ${AWS_REGION}
                        aws ecs wait services-stable --cluster ${ECS_CLUSTER} --services ${ECS_FRONTEND_SERVICE} --region ${AWS_REGION}
                    '''
                }
            }
        }
    }
    
    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
        }
        always {
            cleanWs()
        }
    }
}
