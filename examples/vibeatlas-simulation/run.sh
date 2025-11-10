#!/bin/bash

echo "VibeAtlas Simulation"
echo "===================="
echo ""

# Check API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY not set"
  echo "Please set it: export ANTHROPIC_API_KEY=sk-ant-..."
  exit 1
fi

echo "Step 1/4: Generating 100 personas..."
npx @suts/cli persona generate ./analysis/*.md -n 100 -d 0.9 -o personas.json

echo ""
echo "Step 2/4: Running 14-day simulation..."
npx @suts/cli simulate simulation.json -p personas.json

echo ""
echo "Step 3/4: Analyzing results..."
npx @suts/cli analyze ./output --format html -o report.html

echo ""
echo "Step 4/4: GO/NO-GO decision..."
npx @suts/cli analyze go-no-go ./output \
  --threshold-satisfaction 0.7 \
  --threshold-churn 0.2 \
  --threshold-viral 1.0

echo ""
echo "Simulation complete!"
echo "Report: ./report.html"
echo "Results: ./output/"
