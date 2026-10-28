@echo off
echo ========================================
echo  ByteVision Reelworks - Email Sender
echo ========================================
echo.

cd /d "%~dp0scripts"

echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed.
    echo Please install Python from python.org then run this again.
    pause
    exit
)

echo Installing dependencies...
pip install anthropic requests beautifulsoup4 imap-tools python-dotenv -q

echo.
echo Sending up to 15 emails...
echo.
python send_emails.py --limit 15 --yes

echo.
echo ========================================
echo  Done. Check above for results.
echo ========================================
pause
