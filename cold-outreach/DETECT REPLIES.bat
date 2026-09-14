@echo off
echo ========================================
echo  ByteVision Reelworks - Reply Detector
echo ========================================
echo.

cd /d "%~dp0scripts"

python detect_replies.py

echo.
pause
