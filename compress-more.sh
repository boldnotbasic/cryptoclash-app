#!/bin/bash

echo "🗜️ Further compressing images for GitHub push..."

# Compress all PNG files to max 400px and 60% quality
for img in public/*.png; do
  if [ -f "$img" ]; then
    filename=$(basename "$img")
    echo "📦 Further compressing $filename..."
    
    # More aggressive compression
    sips -Z 400 --setProperty formatOptions 60 "$img" >/dev/null 2>&1
    
    new_size=$(ls -lh "$img" | awk '{print $5}')
    echo "  ✅ $filename: now $new_size"
  fi
done

echo ""
echo "📊 Total public folder size after aggressive compression:"
du -sh public/
echo ""
echo "🚀 Ready for GitHub push!"
