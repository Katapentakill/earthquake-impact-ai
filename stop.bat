@echo off
echo ================================================
echo  Stopping Seismic Monitoring System
echo ================================================
echo.

docker-compose down

echo.
echo Services stopped successfully!
echo.
pause
