#!/bin/bash

# Remove unused AnalysisConfig imports
sed -i '/^import { AnalysisConfig } from/d' src/insights/ImpactEstimator.ts
sed -i '/^import { AnalysisConfig } from/d' src/insights/RecommendationEngine.ts
sed -i '/^import { AnalysisConfig } from/d' src/stats/SurvivalAnalysis.ts
sed -i '/^import { AnalysisConfig } from/d' src/stats/TimeSeriesAnalyzer.ts

# Fix AnalysisEngine instantiations
sed -i 's/new ImpactEstimator(this.config)/new ImpactEstimator()/' src/AnalysisEngine.ts
sed -i 's/new ConfidenceScorer(this.config)/new ConfidenceScorer()/' src/AnalysisEngine.ts

# Fix test file
sed -i 's/new TimeSeriesAnalyzer(DEFAULT_ANALYSIS_CONFIG)/new TimeSeriesAnalyzer()/' src/stats/__tests__/TimeSeriesAnalyzer.test.ts

echo "Fixed constructor calls"
