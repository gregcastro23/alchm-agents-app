#!/bin/bash

# Fix all imports that use ../../../../lib/ to use @/lib/ instead
find app/api -type f -name "*.ts" -exec sed -i '' "s|from '../../../../lib/|from '@/lib/|g" {} +

echo "✅ Fixed all imports in app/api to use @/lib/ alias"
