@echo off
setlocal

rem Get the version from package.json
for /f "tokens=3 delims=:, " %%i in ('findstr /ri "\"version\"" package.json') do (
    set "VERSION=%%i"
)
set "VERSION=%VERSION:~1,-1%"

rem Commit, tag, and push
git commit -m "chore(release): v%VERSION%" && git tag v%VERSION% && git push origin main && git push origin main --tags

endlocal
