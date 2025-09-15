#!/bin/bash

# ZEKE Complete Deployment Workflow
# Orchestrates the entire production deployment process with validation and decision points

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKFLOW_LOG="$PROJECT_ROOT/deployment-workflow-$(date +%Y%m%d_%H%M%S).log"

# Deployment configuration
DRY_RUN=false
SKIP_TESTS=false
AUTO_PROCEED=false
ROLLBACK_ON_FAILURE=true

# Function to log messages
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message" | tee -a "$WORKFLOW_LOG"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$WORKFLOW_LOG"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message" | tee -a "$WORKFLOW_LOG"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$WORKFLOW_LOG"
            ;;
        "STEP")
            echo -e "${PURPLE}[STEP]${NC} $message" | tee -a "$WORKFLOW_LOG"
            ;;
    esac
    echo "[$timestamp] [$level] $message" >> "$WORKFLOW_LOG"
}

# Function to display banner
show_banner() {
    echo -e "${PURPLE}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    ZEKE PRODUCTION DEPLOYMENT                ║
║                                                              ║
║              Comprehensive CLI-Based Workflow               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Function to confirm deployment
confirm_deployment() {
    if [[ "$AUTO_PROCEED" == true ]]; then
        log "INFO" "Auto-proceed enabled, skipping confirmation"
        return 0
    fi
    
    echo ""
    echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT CONFIRMATION${NC}"
    echo "=================================================="
    echo ""
    echo "This will deploy the ZEKE platform to production:"
    echo "• Database migrations and schema updates"
    echo "• Worker service deployment to Railway"
    echo "• Main application deployment to Vercel"
    echo "• Marketing site deployment to Vercel"
    echo ""
    echo "Configuration:"
    echo "• Dry Run: $DRY_RUN"
    echo "• Skip Tests: $SKIP_TESTS"
    echo "• Auto Proceed: $AUTO_PROCEED"
    echo "• Rollback on Failure: $ROLLBACK_ON_FAILURE"
    echo ""
    
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "${BLUE}This is a DRY RUN - no actual deployments will be performed${NC}"
        echo ""
    fi
    
    read -p "Are you ready to proceed with the deployment? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        log "INFO" "Deployment cancelled by user"
        exit 0
    fi
    
    log "INFO" "Deployment confirmed by user"
}

# Function to validate prerequisites
validate_prerequisites() {
    log "STEP" "Validating deployment prerequisites..."
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_ROOT/.env.production" ]]; then
        log "ERROR" ".env.production file not found"
        log "ERROR" "Please create .env.production with production credentials"
        exit 1
    fi
    
    # Check CLI tools
    local required_tools=("node" "pnpm" "supabase" "railway" "vercel" "psql" "curl" "jq" "bc")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' is not installed"
            exit 1
        fi
    done
    
    # Check authentication
    if ! supabase projects list &> /dev/null; then
        log "ERROR" "Supabase CLI not authenticated"
        exit 1
    fi
    
    if ! railway whoami &> /dev/null; then
        log "ERROR" "Railway CLI not authenticated"
        exit 1
    fi
    
    if ! vercel whoami &> /dev/null; then
        log "ERROR" "Vercel CLI not authenticated"
        exit 1
    fi
    
    log "SUCCESS" "All prerequisites validated"
}

# Function to run pre-deployment checks
run_pre_deployment_checks() {
    log "STEP" "Running pre-deployment checks..."
    
    # Check git status
    if [[ -n "$(git status --porcelain)" ]]; then
        log "WARNING" "Working directory has uncommitted changes"
        if [[ "$AUTO_PROCEED" != true ]]; then
            read -p "Continue anyway? (yes/no): " continue_dirty
            if [[ $continue_dirty != "yes" ]]; then
                log "ERROR" "Deployment cancelled due to uncommitted changes"
                exit 1
            fi
        fi
    fi
    
    # Check if on main branch
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        log "WARNING" "Not on main branch (currently on: $current_branch)"
        if [[ "$AUTO_PROCEED" != true ]]; then
            read -p "Continue anyway? (yes/no): " continue_branch
            if [[ $continue_branch != "yes" ]]; then
                log "ERROR" "Deployment cancelled - not on main branch"
                exit 1
            fi
        fi
    fi
    
    # Build check
    log "INFO" "Running build validation..."
    if ! pnpm build &> /dev/null; then
        log "ERROR" "Build validation failed"
        exit 1
    fi
    
    log "SUCCESS" "Pre-deployment checks completed"
}

# Function to execute deployment
execute_deployment() {
    log "STEP" "Executing production deployment..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "DRY RUN: Would execute deployment script"
        log "INFO" "DRY RUN: Command would be: $SCRIPT_DIR/deploy-production.sh"
        return 0
    fi
    
    # Execute the main deployment script
    if "$SCRIPT_DIR/deploy-production.sh"; then
        log "SUCCESS" "Deployment script completed successfully"
        return 0
    else
        log "ERROR" "Deployment script failed"
        return 1
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        log "INFO" "Skipping smoke tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log "STEP" "Running comprehensive smoke tests..."
    
    if [[ "$DRY_RUN" == true ]]; then
        log "INFO" "DRY RUN: Would execute smoke tests"
        log "INFO" "DRY RUN: Command would be: $SCRIPT_DIR/smoke-tests.sh"
        return 0
    fi
    
    # Execute smoke tests
    local test_exit_code=0
    "$SCRIPT_DIR/smoke-tests.sh" || test_exit_code=$?
    
    case $test_exit_code in
        0)
            log "SUCCESS" "All smoke tests passed!"
            return 0
            ;;
        1)
            log "WARNING" "Some smoke tests failed but deployment may proceed"
            if [[ "$AUTO_PROCEED" != true ]]; then
                read -p "Continue with warnings? (yes/no): " continue_warnings
                if [[ $continue_warnings != "yes" ]]; then
                    log "ERROR" "Deployment cancelled due to test warnings"
                    return 1
                fi
            fi
            return 0
            ;;
        2)
            log "ERROR" "Critical smoke tests failed"
            return 1
            ;;
        *)
            log "ERROR" "Smoke tests failed with unexpected exit code: $test_exit_code"
            return 1
            ;;
    esac
}

# Function to handle deployment failure
handle_deployment_failure() {
    log "ERROR" "Deployment failed!"
    
    if [[ "$ROLLBACK_ON_FAILURE" == true ]]; then
        log "WARNING" "Initiating automatic rollback..."
        
        if [[ "$DRY_RUN" == true ]]; then
            log "INFO" "DRY RUN: Would execute rollback script"
            log "INFO" "DRY RUN: Command would be: $SCRIPT_DIR/rollback-production.sh"
        else
            if "$SCRIPT_DIR/rollback-production.sh"; then
                log "SUCCESS" "Rollback completed successfully"
            else
                log "ERROR" "Rollback failed! Manual intervention required"
            fi
        fi
    else
        log "WARNING" "Automatic rollback disabled"
        log "INFO" "To rollback manually, run: $SCRIPT_DIR/rollback-production.sh"
    fi
}

# Function to generate final report
generate_final_report() {
    local deployment_status="$1"
    local report_file="$PROJECT_ROOT/deployment-final-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# ZEKE Production Deployment Final Report

**Date:** $(date)
**Status:** $deployment_status
**Workflow Log:** $WORKFLOW_LOG

## Deployment Configuration

- **Dry Run:** $DRY_RUN
- **Skip Tests:** $SKIP_TESTS
- **Auto Proceed:** $AUTO_PROCEED
- **Rollback on Failure:** $ROLLBACK_ON_FAILURE

## Deployment Summary

$(tail -50 "$WORKFLOW_LOG" | grep -E "\[(SUCCESS|ERROR|WARNING)\]")

## Next Steps

EOF

    case $deployment_status in
        "SUCCESS")
            cat >> "$report_file" << EOF
✅ **DEPLOYMENT SUCCESSFUL**

1. Monitor all services for 24-48 hours
2. Set up automated monitoring and alerting
3. Conduct user acceptance testing
4. Plan CI/CD pipeline implementation

## Service URLs

Check the deployment log for specific service URLs.

EOF
            ;;
        "FAILED")
            cat >> "$report_file" << EOF
❌ **DEPLOYMENT FAILED**

1. Review deployment logs for error details
2. Address identified issues
3. Consider rollback if services are unstable
4. Re-run deployment after fixes

## Troubleshooting

- Check service logs for specific error messages
- Verify environment variables are correct
- Ensure all prerequisites are met
- Test individual components separately

EOF
            ;;
    esac
    
    cat >> "$report_file" << EOF
## Emergency Procedures

If critical issues arise:
\`\`\`bash
./scripts/rollback-production.sh
\`\`\`

## Support

- Review logs: $WORKFLOW_LOG
- Check individual service logs
- Consult deployment documentation

EOF

    log "INFO" "Final deployment report generated: $report_file"
}

# Main workflow function
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --auto-proceed)
                AUTO_PROCEED=true
                shift
                ;;
            --no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "ZEKE Production Deployment Workflow"
                echo ""
                echo "Options:"
                echo "  --dry-run         Simulate deployment without making changes"
                echo "  --skip-tests      Skip smoke tests after deployment"
                echo "  --auto-proceed    Skip interactive confirmations"
                echo "  --no-rollback     Disable automatic rollback on failure"
                echo "  -h, --help        Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                    # Interactive deployment with all checks"
                echo "  $0 --dry-run          # Simulate deployment"
                echo "  $0 --auto-proceed     # Automated deployment"
                echo "  $0 --skip-tests       # Deploy without smoke tests"
                echo ""
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    # Show banner
    show_banner

    log "INFO" "Starting ZEKE production deployment workflow..."
    log "INFO" "Workflow log: $WORKFLOW_LOG"

    # Workflow steps
    local deployment_success=true

    # Step 1: Validate prerequisites
    if ! validate_prerequisites; then
        deployment_success=false
    fi

    # Step 2: Confirm deployment
    if [[ "$deployment_success" == true ]]; then
        confirm_deployment
    fi

    # Step 3: Pre-deployment checks
    if [[ "$deployment_success" == true ]]; then
        if ! run_pre_deployment_checks; then
            deployment_success=false
        fi
    fi

    # Step 4: Execute deployment
    if [[ "$deployment_success" == true ]]; then
        if ! execute_deployment; then
            deployment_success=false
        fi
    fi

    # Step 5: Run smoke tests
    if [[ "$deployment_success" == true ]]; then
        if ! run_smoke_tests; then
            deployment_success=false
        fi
    fi

    # Handle results
    if [[ "$deployment_success" == true ]]; then
        log "SUCCESS" "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
        log "INFO" "The ZEKE platform has been deployed to production"
        generate_final_report "SUCCESS"

        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                              ║${NC}"
        echo -e "${GREEN}║                    DEPLOYMENT SUCCESSFUL!                   ║${NC}"
        echo -e "${GREEN}║                                                              ║${NC}"
        echo -e "${GREEN}║              ZEKE is now live in production                 ║${NC}"
        echo -e "${GREEN}║                                                              ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""

        exit 0
    else
        log "ERROR" "❌ DEPLOYMENT FAILED!"
        handle_deployment_failure
        generate_final_report "FAILED"

        echo ""
        echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                                                              ║${NC}"
        echo -e "${RED}║                     DEPLOYMENT FAILED!                      ║${NC}"
        echo -e "${RED}║                                                              ║${NC}"
        echo -e "${RED}║              Check logs for error details                   ║${NC}"
        echo -e "${RED}║                                                              ║${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""

        exit 1
    fi
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
