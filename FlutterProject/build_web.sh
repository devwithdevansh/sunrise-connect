#!/usr/bin/env bash
# Exit on error
set -e

# Path to the flutter directory relative to this script
FLUTTER_DIR="$(pwd)/../flutter"

if [ ! -d "$FLUTTER_DIR" ]; then
  echo "Downloading Flutter..."
  curl -C - -O https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.22.0-stable.tar.xz
  echo "Extracting Flutter..."
  tar xf flutter_linux_3.22.0-stable.tar.xz -C ..
fi

echo "Adding Flutter to PATH..."
export PATH="$PATH:$FLUTTER_DIR/bin"

echo "Configuring Flutter..."
flutter config --enable-web

echo "Getting dependencies..."
flutter pub get

echo "Building web project..."
flutter build web --release
