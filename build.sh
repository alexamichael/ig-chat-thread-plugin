#!/bin/bash

# Build script to combine headerImage.js into ui.html
# Run this after making changes: ./build.sh

cd "$(dirname "$0")"

# Read the headerImage.js content
IMAGE_DATA=$(cat headerImage.js)

# Create the combined ui.html by replacing the external script reference
# with inline script content
sed 's|<script src="headerImage.js"></script>|<script>'"$IMAGE_DATA"'</script>|' ui.html > ui-built.html

echo "✅ Built ui-built.html successfully"
