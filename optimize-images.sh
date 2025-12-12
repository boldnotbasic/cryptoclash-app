#!/bin/bash

echo "🖼️ Optimizing images for Render deployment..."

# Create backup directory
mkdir -p public/original-images

# List of large images to optimize
LARGE_IMAGES=(
  "Bull-run.png"
  "goudhaantje.png" 
  "Test.png"
  "wincash.png"
  "Whala-alert.png"
  "Beurscrash.png"
  "Nugget.png"
  "orlo.png"
  "rex.png"
  "dsheep.png"
  "lentra.png"
  "omlt.png"
  "Collage_logo.png"
)

for img in "${LARGE_IMAGES[@]}"; do
  if [ -f "public/$img" ]; then
    echo "📦 Optimizing $img..."
    
    # Backup original
    cp "public/$img" "public/original-images/$img" 2>/dev/null
    
    # Optimize with sips (macOS built-in tool)
    # Reduce to max 800px width and 80% quality
    sips -Z 800 --setProperty formatOptions 80 "public/$img" >/dev/null 2>&1
    
    # Show size difference
    original_size=$(ls -lh "public/original-images/$img" 2>/dev/null | awk '{print $5}')
    new_size=$(ls -lh "public/$img" | awk '{print $5}')
    echo "  ✅ $img: $original_size → $new_size"
  fi
done

echo ""
echo "📊 Total public folder size after optimization:"
du -sh public/
echo ""
echo "🚀 Images optimized! Ready for deployment."
