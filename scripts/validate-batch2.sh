#!/bin/bash

# Ensure cleanup on interrupt
trap 'cleanup_on_interrupt' INT TERM

cleanup_on_interrupt() {
    echo -e "\n${RED}Script interrupted${NC}"
    if [ ! -z "$ORIGINAL_BRANCH" ]; then
        echo -e "${YELLOW}Restoring original branch...${NC}"
        git checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
    fi
    if [ "$STASHED" = true ]; then
        echo -e "${YELLOW}Restoring stashed changes...${NC}"
        git stash pop 2>/dev/null || echo -e "${YELLOW}⚠ Run 'git stash list' to manually restore changes${NC}"
    fi
    exit 130
}

# Navigate to repo root (from script's location)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT" || {
    echo "ERROR: Failed to navigate to repository root"
    exit 1
}

# Verify we're in the correct repository
if [ ! -f "package.json" ]; then
    echo "ERROR: Not in a valid repository (package.json not found)"
    exit 1
fi

# Create logs directory for validation output
LOGS_DIR="$REPO_ROOT/.logs/batch2-validation"
mkdir -p "$LOGS_DIR"

echo "Working directory: $REPO_ROOT"
echo "Logs directory: $LOGS_DIR"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "========================================="
echo "SUTS BATCH 2 - LOCAL VALIDATION"
echo "========================================="

# Check for uncommitted changes and stash if needed
STASHED=false
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Uncommitted changes detected. Stashing...${NC}"
    git stash push -u -m "Batch 2 validation - auto stash"
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to stash changes${NC}"
        exit 1
    fi
    STASHED=true
    echo -e "${GREEN}✓ Changes stashed${NC}"
fi

# Store original branch
ORIGINAL_BRANCH=$(git branch --show-current)
echo "Current branch: $ORIGINAL_BRANCH"
echo ""

# Fetch all branches
echo -e "${YELLOW}[1/5] Fetching all branches...${NC}"
git fetch origin
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Git fetch failed${NC}"
    # Restore stash if we stashed
    if [ "$STASHED" = true ]; then
        git stash pop
    fi
    exit 1
fi
echo -e "${GREEN}✓ Fetch complete${NC}"

# Array of branches to validate
branches=(
    "claude/network-simulator-viral-spread-011CUyqvqSYCCXbERy2yM7LS"
    "claude/analysis-engine-implementation-011CUyqyAECUrb51ZfSJT3jf"
    "claude/decision-system-implementation-011CUyr2NumSicYKokvsdp5G"
    "claude/vibeatlas-plugin-adapter-011CUyr9gwgGoz3CE7E3rnT6"
)

failed_branches=()
passed_branches=()

# Validate each branch
for i in "${!branches[@]}"; do
    branch="${branches[$i]}"
    # Sanitize branch name for log file (replace / with -)
    branch_safe="${branch//\//-}"
    step=$((i+2))

    echo -e "\n${BLUE}=========================================${NC}"
    echo -e "${YELLOW}[${step}/5] Validating ${branch}...${NC}"
    echo -e "${BLUE}=========================================${NC}"

    # Checkout branch
    echo -e "${YELLOW}Checking out branch...${NC}"
    git checkout "$branch" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to checkout ${branch}${NC}"
        failed_branches+=("$branch: checkout failed")
        continue
    fi

    # Pull latest
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull origin "$branch" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to pull ${branch}${NC}"
        failed_branches+=("$branch: pull failed")
        continue
    fi

    # Install dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install --silent 2>/dev/null
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ npm install failed on ${branch}${NC}"
        failed_branches+=("$branch: npm install failed")
        continue
    fi

    # Run type-check
    echo -e "${YELLOW}Running TypeScript type-check...${NC}"
    npm run type-check 2>&1 | tee "$LOGS_DIR/typecheck-${branch_safe}.log"
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ TypeScript errors on ${branch}${NC}"
        echo -e "${RED}See $LOGS_DIR/typecheck-${branch_safe}.log for details${NC}"
        failed_branches+=("$branch: TypeScript errors")
        continue
    fi
    echo -e "${GREEN}✓ TypeScript: 0 errors${NC}"

    # Run lint
    echo -e "${YELLOW}Running ESLint...${NC}"
    npm run lint 2>&1 | tee "$LOGS_DIR/lint-${branch_safe}.log"
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ ESLint errors on ${branch}${NC}"
        echo -e "${RED}See $LOGS_DIR/lint-${branch_safe}.log for details${NC}"
        failed_branches+=("$branch: ESLint errors")
        continue
    fi
    echo -e "${GREEN}✓ ESLint: 0 errors/warnings${NC}"

    # Run tests with coverage
    echo -e "${YELLOW}Running tests with coverage...${NC}"
    npm run test:coverage 2>&1 | tee "$LOGS_DIR/test-${branch_safe}.log"
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Tests or coverage failed on ${branch}${NC}"
        echo -e "${RED}See $LOGS_DIR/test-${branch_safe}.log for details${NC}"

        # Extract coverage summary if available
        coverage_summary=$(grep -A 10 "Coverage summary" "$LOGS_DIR/test-${branch_safe}.log")
        if [ ! -z "$coverage_summary" ]; then
            echo -e "${YELLOW}Coverage Summary:${NC}"
            echo "$coverage_summary"
        fi

        failed_branches+=("$branch: Tests/Coverage failed")
        continue
    fi

    # Extract and display coverage
    coverage_summary=$(grep -A 5 "Coverage summary" "$LOGS_DIR/test-${branch_safe}.log" | tail -n 4)
    if [ ! -z "$coverage_summary" ]; then
        echo -e "${GREEN}✓ Tests passed with coverage:${NC}"
        echo "$coverage_summary"
    else
        echo -e "${GREEN}✓ Tests passed${NC}"
    fi

    # Run full CI
    echo -e "${YELLOW}Running full CI pipeline...${NC}"
    npm run ci 2>&1 | tee "$LOGS_DIR/ci-${branch_safe}.log"
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ CI pipeline failed on ${branch}${NC}"
        echo -e "${RED}See $LOGS_DIR/ci-${branch_safe}.log for details${NC}"
        failed_branches+=("$branch: CI failed")
        continue
    fi

    echo -e "${GREEN}✓ ${branch} PASSED all checks${NC}"
    passed_branches+=("$branch")
done

# Final report
echo -e "\n${BLUE}=========================================${NC}"
echo "BATCH 2 VALIDATION COMPLETE"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${GREEN}Passed: ${#passed_branches[@]}/4 branches${NC}"
for branch in "${passed_branches[@]}"; do
    echo -e "  ${GREEN}✓ ${branch}${NC}"
done

# Restore original state
echo -e "\n${YELLOW}Restoring original state...${NC}"
git checkout "$ORIGINAL_BRANCH" 2>/dev/null
if [ "$STASHED" = true ]; then
    echo -e "${YELLOW}Restoring stashed changes...${NC}"
    git stash pop
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Changes restored${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Could not restore stashed changes. Run 'git stash list' to see stash.${NC}"
    fi
fi

if [ ${#failed_branches[@]} -eq 0 ]; then
    echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ ALL 4 BRANCHES PASSED VALIDATION!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Report to orchestrator: 'All 4 Batch 2 branches validated successfully'"
    echo "2. Wait for merge instructions"
    echo ""
    exit 0
else
    echo -e "\n${RED}Failed: ${#failed_branches[@]}/4 branches${NC}"
    for failure in "${failed_branches[@]}"; do
        echo -e "  ${RED}✗ ${failure}${NC}"
    done
    echo -e "\n${YELLOW}Logs available in:${NC}"
    echo "  $LOGS_DIR/typecheck-*.log"
    echo "  $LOGS_DIR/lint-*.log"
    echo "  $LOGS_DIR/test-*.log"
    echo "  $LOGS_DIR/ci-*.log"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Review failure logs above"
    echo "2. Report failures to orchestrator with details"
    echo "3. Wait for fix instructions"
    echo ""
    exit 1
fi
