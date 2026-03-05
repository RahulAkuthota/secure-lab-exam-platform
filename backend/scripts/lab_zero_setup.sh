#!/bin/bash

# Lab Zero-Setup Helper Script
# This script is pushed/executed by the server to launch the secure browser.

APP_IMAGE="/tmp/secure-exam-browser.AppImage"
DISPLAY_ENV=":0"

# 1. Ensure the display is available
if [ -z "$DISPLAY" ]; then
    export DISPLAY=$DISPLAY_ENV
fi

# 2. Check if the AppImage exists
if [ ! -f "$APP_IMAGE" ]; then
    echo "Error: Secure Exam Browser AppImage not found at $APP_IMAGE"
    exit 1
fi

# 3. Make executable
chmod +x "$APP_IMAGE"

# 4. Launch the app in the background
# We use --no-sandbox because AppImages on some Ubuntu versions need it if running as root or via SSH
"$APP_IMAGE" --no-sandbox > /dev/null 2>&1 &

echo "Secure Exam Browser launched successfully on $DISPLAY_ENV"
