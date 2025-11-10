#!/bin/bash

# Fix emotional state access (dot notation to bracket notation)
find src -name "*.ts" -type f -exec sed -i 's/emotionalState\.frustration/emotionalState["frustration"]/g' {} \;
find src -name "*.ts" -type f -exec sed -i 's/emotionalState\.delight/emotionalState["delight"]/g' {} \;
find src -name "*.ts" -type f -exec sed -i 's/emotionalState\.confusion/emotionalState["confusion"]/g' {} \;
find src -name "*.ts" -type f -exec sed -i 's/emotionalState\.confidence/emotionalState["confidence"]/g' {} \;

echo "Fixed emotional state access patterns"
