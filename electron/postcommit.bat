@echo off
setlocal

rem Get the version from package.json
for /f "tokens=3 delims=:, " %%i in ('findstr /ri "\"version\"" package.json') do (
    set "VERSION=%%i"
)
set "VERSION=%VERSION:~1,-1%"

rem Ensure the version is correctly extracted
if "%VERSION%"=="" (
    echo Failed to extract version from package.json
    exit /b 1
)

rem Delete the local tag if it exists
git tag -d v%VERSION%

rem Delete the remote tag if it exists
git push origin :refs/tags/v%VERSION%

rem Tag and push
git tag v%VERSION%
git push origin main --tags

endlocal