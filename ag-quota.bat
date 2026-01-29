@echo off
echo Antigravity Quota Monitor v1.0.0
echo =================================
echo.

if "%1"=="" (
    echo Usage: ag-quota [options]
    echo.
    echo Common options:
    echo   --table        Display as table
    echo   --account N    Check specific account (1, 2, 3...)
    echo   --watch        Auto-refresh mode
    echo   --tui          Interactive TUI
    echo   --help         Show all options
    echo.
    echo Examples:
    echo   ag-quota --table
    echo   ag-quota --account 1
    echo   ag-quota --watch
    echo.
    goto :end
)

if "%1"=="--help" (
    antigravity-quota --help
    goto :end
)

antigravity-quota %*

:end
pause