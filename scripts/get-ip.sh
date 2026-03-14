#!/bin/bash

# Script to find your local IP address for mobile device access
# Usage: ./scripts/get-ip.sh

echo "🔍 Finding your local IP address..."
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 macOS detected"
    echo ""
    echo "Your local IP addresses:"
    ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print "  • " $2}'
    echo ""
    echo "🌐 Primary Wi-Fi IP (usually en0):"
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
    if [ -n "$IP" ]; then
        echo "  ✅ http://$IP:3000"
    else
        echo "  ⚠️  Could not detect Wi-Fi IP. Check Network Settings."
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "📱 Linux detected"
    echo ""
    echo "Your local IP addresses:"
    hostname -I | tr ' ' '\n' | awk '{print "  • " $1}'
    echo ""
    IP=$(hostname -I | awk '{print $1}')
    if [ -n "$IP" ]; then
        echo "🌐 Primary IP:"
        echo "  ✅ http://$IP:3000"
    fi
else
    echo "⚠️  Unsupported OS. Please find your IP manually:"
    echo "  Windows: ipconfig | findstr IPv4"
    echo "  macOS: ipconfig getifaddr en0"
    echo "  Linux: hostname -I"
fi

echo ""
echo "💡 Make sure your mobile device is on the same Wi-Fi network!"
echo "💡 Then open the URL above in your mobile browser."
