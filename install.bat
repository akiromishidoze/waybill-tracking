@echo off
setlocal enabledelayedexpansion

echo --- Waybill Tracking Installer ---
echo.

REM Check prerequisites
where docker >nul 2>&1
if errorlevel 1 (
  echo [ERR] Docker not found. Install Docker Desktop from https://docs.docker.com/desktop/
  exit /b 1
)
where git >nul 2>&1
if errorlevel 1 (
  echo [ERR] Git not found. Install from https://git-scm.com/
  exit /b 1
)

set DC=docker compose
docker compose version >nul 2>&1
if errorlevel 1 (
  docker-compose version >nul 2>&1
  if errorlevel 1 (
    echo [ERR] Docker Compose not found.
    exit /b 1
  )
  set DC=docker-compose
)

echo [OK] Prerequisites met: Docker, Git, %DC%

if not "%INSTALL_DIR%"=="" goto :skip_default_dir
set INSTALL_DIR=%USERPROFILE%\waybill-tracking
:skip_default_dir

if exist "%INSTALL_DIR%\.git" (
  echo [WARN] Directory already contains a git repo.
  set /p yn="  Use existing repo and pull latest? [Y/n]: "
  if /i "!yn!"=="n" (
    echo [INFO] Using existing repo as-is.
  ) else (
    pushd "%INSTALL_DIR%"
    git pull --ff-only
    popd
    echo [OK] Pulled latest.
  )
) else (
  echo [INFO] Cloning into %INSTALL_DIR% ...
  git clone https://github.com/akiromishidoze/waybill-tracking.git "%INSTALL_DIR%"
  echo [OK] Repository cloned.
)

pushd "%INSTALL_DIR%"

REM Generate JWT secret
for /f "tokens=*" %%a in ('powershell -Command "[System.Convert]::ToBase64String((New-Object byte[] 48))"') do set JWT_SECRET=%%a
if "%JWT_SECRET%"=="" set JWT_SECRET=change-me-in-production

if exist .env (
  echo [WARN] .env already exists - backing up to .env.bak
  copy .env .env.bak >nul
)
echo JWT_SECRET=%JWT_SECRET% > .env
echo [OK] JWT_SECRET written to .env

echo [INFO] Pulling images and building services ...
%DC% pull --quiet 2>nul
%DC% build --quiet 2>nul

echo [INFO] Starting all services ...
%DC% up -d

echo [INFO] Waiting 60s for services to start ...
timeout /t 60 /nobreak >nul

echo.
echo [INFO] === Setup Complete ===
echo.
echo   Dashboard      http://localhost:5173
echo   Core API       http://localhost:8080/health
echo   Analytics API  http://localhost:8000/health
echo   Postgres       localhost:5432 (user: postgres, password: postgres)
echo   Redis          localhost:6379
echo   Elasticsearch  http://localhost:9200
echo   Prometheus     http://localhost:9090
echo   Grafana        http://localhost:3001 (admin / admin)
echo.
echo [OK] Waybill Tracking is running!
echo.
echo Run  cd /d "%INSTALL_DIR%" ^&^& %DC% logs -f  to follow logs.
echo Run  %DC% down  to stop all services.

popd
endlocal
