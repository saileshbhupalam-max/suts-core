/**
 * Validation Reporter - Generates reports for RGS validation results
 * Supports Markdown and JSON output formats
 */

import type { ValidationResult } from './types';

/**
 * Generate Markdown report from validation results
 * @param result - Validation test results
 * @returns Formatted Markdown report
 */
export function generateReport(result: ValidationResult): string {
  if (result === null || result === undefined) {
    throw new Error('Validation result cannot be null or undefined');
  }

  const sections = [
    generateHeader(result),
    generateSummary(result),
    generateBreakdown(result),
    generateMetadata(result),
    generateConclusion(result),
  ];

  return sections.join('\n\n');
}

/**
 * Generate report header
 */
function generateHeader(result: ValidationResult): string {
  const date = new Date(result.timestamp).toLocaleString();

  return `# RGS Validation Report

**Generated:** ${date}
**Validator Version:** ${result.metadata.validatorVersion}`;
}

/**
 * Generate summary section
 */
function generateSummary(result: ValidationResult): string {
  const improvement = result.improvement >= 0 ? '+' : '';
  const improvementPercentage = result.improvement.toFixed(2);
  const targetMet = result.groundedAccuracy >= 92;
  const status = targetMet ? '✅ TARGET MET' : '⚠️  TARGET NOT MET';

  return `## Summary

| Metric | Value |
|--------|-------|
| **Base Accuracy** | ${result.baseAccuracy.toFixed(2)}% |
| **Grounded Accuracy** | ${result.groundedAccuracy.toFixed(2)}% |
| **Improvement** | ${improvement}${improvementPercentage}pp |
| **Confidence** | ${(result.confidence * 100).toFixed(1)}% |
| **Sample Size** | ${result.sampleSize} personas |
| **Test Duration** | ${result.testDuration} |
| **Status** | ${status} |

**Goal:** Prove RGS improves SUTS accuracy from 85% to 92%+`;
}

/**
 * Generate breakdown by category
 */
function generateBreakdown(result: ValidationResult): string {
  const { breakdown } = result;

  const positioningDiff = breakdown.positioning.grounded - breakdown.positioning.base;
  const retentionDiff = breakdown.retention.grounded - breakdown.retention.base;
  const viralDiff = breakdown.viral.grounded - breakdown.viral.base;

  return `## Accuracy Breakdown

### Positioning Accuracy

| Type | Accuracy | Change |
|------|----------|--------|
| Base | ${breakdown.positioning.base.toFixed(2)}% | - |
| Grounded | ${breakdown.positioning.grounded.toFixed(2)}% | ${formatChange(positioningDiff)} |

### Retention Accuracy

| Type | Accuracy | Change |
|------|----------|--------|
| Base | ${breakdown.retention.base.toFixed(2)}% | - |
| Grounded | ${breakdown.retention.grounded.toFixed(2)}% | ${formatChange(retentionDiff)} |

### Viral Coefficient Accuracy

| Type | Accuracy | Change |
|------|----------|--------|
| Base | ${breakdown.viral.base.toFixed(2)}% | - |
| Grounded | ${breakdown.viral.grounded.toFixed(2)}% | ${formatChange(viralDiff)} |`;
}

/**
 * Generate metadata section
 */
function generateMetadata(result: ValidationResult): string {
  return `## Test Metadata

- **Base Test ID:** \`${result.metadata.baseTestId}\`
- **Grounded Test ID:** \`${result.metadata.groundedTestId}\`
- **Sample Size:** ${result.sampleSize} personas
- **Test Duration:** ${result.testDuration}
- **Timestamp:** ${result.timestamp}`;
}

/**
 * Generate conclusion section
 */
function generateConclusion(result: ValidationResult): string {
  const targetMet = result.groundedAccuracy >= 92;
  const improvementText = result.improvement >= 0 ? 'improvement' : 'decline';

  let conclusion = `## Conclusion

`;

  if (targetMet) {
    conclusion += `✅ **Success!** RGS grounding successfully improved SUTS accuracy from ${result.baseAccuracy.toFixed(2)}% to ${result.groundedAccuracy.toFixed(2)}%, achieving the target of 92%+ accuracy.

The ${result.improvement.toFixed(2)} percentage point improvement demonstrates that real-world grounding significantly enhances persona accuracy across positioning, retention, and viral predictions.`;
  } else {
    conclusion += `⚠️ **Target Not Met.** While RGS grounding showed a ${result.improvement.toFixed(2)} percentage point ${improvementText}, the grounded accuracy of ${result.groundedAccuracy.toFixed(2)}% did not reach the 92% target.

Additional calibration and signal quality improvements may be needed to achieve the target accuracy.`;
  }

  conclusion += `

**Confidence Level:** ${(result.confidence * 100).toFixed(1)}% (based on ${result.sampleSize} samples)`;

  return conclusion;
}

/**
 * Format change value with sign and color
 */
function formatChange(value: number): string {
  if (value > 0) {
    return `+${value.toFixed(2)}pp`;
  } else if (value < 0) {
    return `${value.toFixed(2)}pp`;
  } else {
    return '0.00pp';
  }
}

/**
 * Generate JSON report from validation results
 * @param result - Validation test results
 * @returns JSON string
 */
export function generateJSONReport(result: ValidationResult): string {
  if (result === null || result === undefined) {
    throw new Error('Validation result cannot be null or undefined');
  }

  return JSON.stringify(result, null, 2);
}

/**
 * Generate CSV report from validation results
 * @param result - Validation test results
 * @returns CSV string
 */
export function generateCSVReport(result: ValidationResult): string {
  if (result === null || result === undefined) {
    throw new Error('Validation result cannot be null or undefined');
  }

  const headers = [
    'timestamp',
    'base_accuracy',
    'grounded_accuracy',
    'improvement',
    'confidence',
    'sample_size',
    'test_duration',
    'positioning_base',
    'positioning_grounded',
    'retention_base',
    'retention_grounded',
    'viral_base',
    'viral_grounded',
  ];

  const values = [
    result.timestamp,
    result.baseAccuracy.toString(),
    result.groundedAccuracy.toString(),
    result.improvement.toString(),
    result.confidence.toString(),
    result.sampleSize.toString(),
    result.testDuration,
    result.breakdown.positioning.base.toString(),
    result.breakdown.positioning.grounded.toString(),
    result.breakdown.retention.base.toString(),
    result.breakdown.retention.grounded.toString(),
    result.breakdown.viral.base.toString(),
    result.breakdown.viral.grounded.toString(),
  ];

  return `${headers.join(',')}\n${values.join(',')}`;
}
