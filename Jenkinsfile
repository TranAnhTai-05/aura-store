// CI/CD: GitHub → Jenkins (Windows) → Docker Hub → Docker Desktop trên cùng máy. Hướng dẫn: docs/DEPLOY.md
//
// Credentials cần tạo trong Jenkins (Manage Jenkins → Credentials → Global):
//   github-pat      Username with password: tài khoản GitHub + Personal Access Token
//   dockerhub-cred  Username with password: tài khoản Docker Hub + Access Token
//
// Trước lần chạy đầu phải có tệp C:\aura-deploy\.env (mẫu trong docs/DEPLOY.md).
pipeline {
    agent any

    environment {
        IMAGE_NAME           = 'aura-store'
        DEPLOY_DIR           = 'C:\\aura-deploy'
        // Tên các container: aura-prod-app-1, aura-prod-mysql-1
        COMPOSE_PROJECT_NAME = 'aura-prod'
    }

    // Máy cá nhân không nhận được webhook từ GitHub, nên Jenkins tự hỏi GitHub khoảng 2 phút một lần
    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // Stage build của Dockerfile chạy "npm run lint" và "npm run build",
        // nên lỗi TypeScript hoặc lỗi build dừng pipeline ngay tại đây.
        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                        usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat 'docker build -t docker.io/%DOCKER_USER%/%IMAGE_NAME%:%BUILD_NUMBER% -t docker.io/%DOCKER_USER%/%IMAGE_NAME%:latest .'
                }
            }
        }

        stage('Push Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                        usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    // Dùng cmd thay vì PowerShell: PowerShell chèn BOM vào đầu mật khẩu khi pipe,
                    // khiến Docker Hub báo "incorrect username or password"
                    bat '''
                        @echo off
                        echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin || exit /b 1
                        docker push docker.io/%DOCKER_USER%/%IMAGE_NAME%:%BUILD_NUMBER% || exit /b 1
                        docker push docker.io/%DOCKER_USER%/%IMAGE_NAME%:latest || exit /b 1
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-cred',
                        usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    powershell '''
                        $ErrorActionPreference = 'Stop'
                        $dir = $env:DEPLOY_DIR
                        $envFile = Join-Path $dir '.env'
                        if (-not (Test-Path $envFile)) {
                            throw "Missing $envFile - see docs/DEPLOY.md"
                        }
                        Copy-Item 'docker-compose.prod.yml' (Join-Path $dir 'docker-compose.yml') -Force

                        # Ghi tag vừa build vào .env để "docker compose" chạy tay sau này cũng dùng đúng bản này.
                        # WriteAllLines ghi UTF-8 không BOM, docker compose đọc được.
                        $image = "docker.io/$($env:DOCKER_USER)/$($env:IMAGE_NAME):$($env:BUILD_NUMBER)"
                        $lines = @(Get-Content $envFile | Where-Object { $_ -notmatch '^AURA_IMAGE=' }) + "AURA_IMAGE=$image"
                        [System.IO.File]::WriteAllLines($envFile, $lines)

                        # Dữ liệu MySQL và ảnh tải lên nằm trong volume nên được giữ nguyên
                        Set-Location $dir
                        docker compose up -d
                        if ($LASTEXITCODE) { exit $LASTEXITCODE }
                        docker image prune -f
                    '''
                }
            }
        }
    }

    post {
        always {
            bat 'docker logout'
        }
    }
}
