#!/bin/bash

# Script to check for TypeScript and linting errors
echo "🔍 Checking for TypeScript compilation errors..."
pnpm run build

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful!"
else
    echo "❌ TypeScript compilation failed!"
    exit 1
fi

echo ""
echo "🔍 Checking for linting errors..."
pnpm run lint

if [ $? -eq 0 ]; then
    echo "✅ No linting errors found!"
else
    echo "❌ Linting errors found!"
    exit 1
fi

echo ""
echo "🎉 All checks passed! Code is ready for deployment."