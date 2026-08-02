#!/bin/bash
echo "🔐 Starting CyberSphere Backend..."
cd "$(dirname "$0")/backend"
node server.js
