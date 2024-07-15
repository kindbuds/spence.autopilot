@echo off
setlocal

rem Get the version from package.json
for /f "tokens=2 delims=:," %%i in ('type package.json ^| findstr /i /c:"\"version\" "') do set "VERSION=%%~i"
set "VERSION=%VERSION:~1,-1%"

rem Commit, tag, and push
git commit -m "chore(release): v%VERSION%" && git tag v%VERSION% && git push && git push --tags

endlocal
