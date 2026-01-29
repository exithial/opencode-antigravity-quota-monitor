@echo off
echo Installing Antigravity Quota Monitor...
echo.

REM Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH.
    pause
    exit /b 1
)

REM Instalar dependencias
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies.
    pause
    exit /b 1
)

REM Instalar globalmente
echo Installing globally...
call npm link
if %errorlevel% neq 0 (
    echo Warning: Could not install globally. You can still use:
    echo   node src/cli.js
    echo   or
    echo   npm start
)

echo.
echo ============================================
echo Installation complete!
echo.
echo Available commands:
echo   antigravity-quota    - Check all quotas
echo   ag-quota             - Alias for antigravity-quota
echo   npm start            - Run from project directory
echo   npm run tui          - Start TUI interface
echo   npm run build        - Build executable
echo.
echo Examples:
echo   antigravity-quota --table
echo   antigravity-quota --watch
echo   antigravity-quota --account 1
echo.
echo For help: antigravity-quota --help
echo ============================================
echo.
pause