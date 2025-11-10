# SUTS Validation Scripts

This directory contains validation scripts for the SUTS project.

## Batch 2 Validation Script

**File:** `validate-batch2.sh`

**Purpose:** Validates all 4 Batch 2 feature branches after completion.

### Branches Validated

1. `feat/network-simulator`
2. `feat/analysis-engine`
3. `feat/decision-system`
4. `feat/vibeatlas-plugin`

### What It Does

For each branch, the script:
1. Checks out the branch
2. Pulls latest changes
3. Installs dependencies
4. Runs TypeScript type-check
5. Runs ESLint
6. Runs tests with coverage validation
7. Runs full CI pipeline

### How to Run

**On Windows (Git Bash or WSL):**
```bash
# From repository root
./scripts/validate-batch2.sh

# Or from scripts directory
cd scripts
./validate-batch2.sh
```

**On Linux/macOS:**
```bash
bash ./scripts/validate-batch2.sh
```

### Output

The script will:
- Display colored output showing progress through each validation step
- Save detailed logs to `.logs/batch2-validation/`
- Provide a final summary showing which branches passed/failed

**Log files created:**
- `.logs/batch2-validation/typecheck-<branch>.log`
- `.logs/batch2-validation/lint-<branch>.log`
- `.logs/batch2-validation/test-<branch>.log`
- `.logs/batch2-validation/ci-<branch>.log`

### Success Output

```
✓ ALL 4 BRANCHES PASSED VALIDATION!

Next steps:
1. Report to orchestrator: 'All 4 Batch 2 branches validated successfully'
2. Wait for merge instructions
```

### Failure Output

```
Failed: X/4 branches
  ✗ feat/branch-name: Specific error

Logs available in:
  D:\Projects\suts-core\.logs\batch2-validation\*.log

Next steps:
1. Review failure logs above
2. Report failures to orchestrator with details
3. Wait for fix instructions
```

### Requirements

- Git Bash (Windows) or Bash shell (Linux/macOS)
- Node.js and npm installed
- Git configured with origin remote
- All 4 branches pushed to origin

### Notes

- The script automatically navigates to the repository root
- Logs are stored locally in `.logs/` (git-ignored)
- The script will exit with code 0 on success, 1 on failure
- Each branch is validated independently
- If one branch fails, the script continues to validate remaining branches
