@echo off
setlocal

rem Get the version from package.json using PowerShell
for /f %%i in ('powershell -Command "(Get-Content package.json | ConvertFrom-Json).version"') do (
    set "VERSION=%%i"
)

rem Ensure the version is correctly extracted
if "%VERSION%"=="" (
    echo Failed to extract version from package.json
    exit /b 1
)

rem Delete the local tag if it exists
git tag -d v%VERSION%

rem Delete the remote tag if it exists
git push origin :refs/tags/v%VERSION%

rem Push changes and tags
git push origin main --tags

endlocal