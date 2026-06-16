#!/bin/bash

# اسکریپت نصب و اجرای تست‌های LMS Bozorgani
# این اسکریپت تمام مراحل نصب و اجرا را خودکار انجام می‌دهد

set -e  # خروج در صورت خطا

# رنگ‌ها برای نمایش بهتر
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# تابع لاگ
log() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

header() {
    echo ""
    echo -e "${PURPLE}$1${NC}"
    echo "$(printf '=%.0s' {1..60})"
}

# بررسی وجود Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        error "Node.js نصب نیست. لطفاً ابتدا Node.js را نصب کنید."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    success "Node.js نصب است: $NODE_VERSION"
}

# بررسی وجود npm
check_npm() {
    if ! command -v npm &> /dev/null; then
        error "npm نصب نیست."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    success "npm نصب است: $NPM_VERSION"
}

# نصب dependencies
install_dependencies() {
    header "📦 نصب Dependencies"
    
    log "نصب dependencies تست..."
    npm install
    
    success "Dependencies با موفقیت نصب شدند"
}

# ایجاد پوشه نتایج
create_results_dir() {
    log "ایجاد پوشه نتایج..."
    mkdir -p test-results
    success "پوشه test-results ایجاد شد"
}

# بررسی وضعیت سرویس‌ها
check_services() {
    header "🔍 بررسی وضعیت سرویس‌ها"
    
    # Backend API
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        success "Backend API (پورت 5000) در حال اجرا است"
    else
        warning "Backend API (پورت 5000) در دسترس نیست"
        info "برای راه‌اندازی Backend: cd ../backend && npm run dev"
    fi
    
    # Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend (پورت 3000) در حال اجرا است"
    else
        warning "Frontend (پورت 3000) در دسترس نیست"
        info "برای راه‌اندازی Frontend: cd ../frontend && npm run dev"
    fi
    
    # Admin Panel
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        success "Admin Panel (پورت 3001) در حال اجرا است"
    else
        warning "Admin Panel (پورت 3001) در دسترس نیست"
        info "برای راه‌اندازی Admin Panel: cd ../admin-panel && npm run dev"
    fi
}

# اجرای تست‌های مختلف
run_tests() {
    header "🧪 اجرای تست‌ها"
    
    # منوی انتخاب
    echo "لطفاً نوع تست مورد نظر را انتخاب کنید:"
    echo "1) تمام تست‌ها"
    echo "2) فقط تست‌های API"
    echo "3) فقط تست‌های یکپارچگی"
    echo "4) فقط تست‌های خطا"
    echo "5) فقط تست احراز هویت"
    echo "6) خروج"
    
    read -p "انتخاب شما (1-6): " choice
    
    case $choice in
        1)
            log "اجرای تمام تست‌ها..."
            node run-all-tests.js
            ;;
        2)
            log "اجرای تست‌های API..."
            node api-test-suite.js
            ;;
        3)
            log "اجرای تست‌های یکپارچگی..."
            node integration-test-suite.js
            ;;
        4)
            log "اجرای تست‌های خطا..."
            node error-scenarios-test.js
            ;;
        5)
            log "اجرای تست احراز هویت..."
            node auth-flow-test.js
            ;;
        6)
            info "خروج از برنامه"
            exit 0
            ;;
        *)
            error "انتخاب نامعتبر"
            exit 1
            ;;
    esac
}

# نمایش نتایج
show_results() {
    header "📊 نتایج تست‌ها"
    
    if [ -d "test-results" ] && [ "$(ls -A test-results)" ]; then
        log "فایل‌های گزارش موجود:"
        ls -la test-results/
        
        # یافتن آخرین گزارش HTML
        LATEST_HTML=$(ls -t test-results/*.html 2>/dev/null | head -n1)
        if [ ! -z "$LATEST_HTML" ]; then
            info "آخرین گزارش HTML: $LATEST_HTML"
            
            # سوال برای باز کردن گزارش
            read -p "آیا می‌خواهید گزارش HTML را باز کنید؟ (y/n): " open_report
            if [ "$open_report" = "y" ] || [ "$open_report" = "Y" ]; then
                if command -v xdg-open &> /dev/null; then
                    xdg-open "$LATEST_HTML"
                elif command -v open &> /dev/null; then
                    open "$LATEST_HTML"
                else
                    info "لطفاً فایل $LATEST_HTML را در مرورگر باز کنید"
                fi
            fi
        fi
    else
        warning "هیچ گزارشی یافت نشد"
    fi
}

# پاک کردن نتایج قدیمی
clean_results() {
    if [ -d "test-results" ] && [ "$(ls -A test-results)" ]; then
        read -p "آیا می‌خواهید نتایج قدیمی را پاک کنید؟ (y/n): " clean_old
        if [ "$clean_old" = "y" ] || [ "$clean_old" = "Y" ]; then
            rm -f test-results/*.json test-results/*.html test-results/*.png
            success "نتایج قدیمی پاک شدند"
        fi
    fi
}

# تابع کمک
show_help() {
    echo "استفاده: $0 [OPTIONS]"
    echo ""
    echo "گزینه‌ها:"
    echo "  --help, -h          نمایش این راهنما"
    echo "  --install-only      فقط نصب dependencies"
    echo "  --check-only        فقط بررسی وضعیت سرویس‌ها"
    echo "  --clean             پاک کردن نتایج قدیمی"
    echo "  --all-tests         اجرای تمام تست‌ها بدون سوال"
    echo "  --api-tests         اجرای فقط تست‌های API"
    echo "  --integration-tests اجرای فقط تست‌های یکپارچگی"
    echo "  --error-tests       اجرای فقط تست‌های خطا"
    echo "  --auth-tests        اجرای فقط تست احراز هویت"
    echo ""
    echo "مثال‌ها:"
    echo "  $0                  اجرای کامل با منوی تعاملی"
    echo "  $0 --all-tests      اجرای تمام تست‌ها"
    echo "  $0 --api-tests      اجرای فقط تست‌های API"
    echo "  $0 --clean          پاک کردن نتایج قدیمی"
}

# تابع اصلی
main() {
    header "🎯 راه‌اندازی تست‌های LMS Bozorgani"
    
    # بررسی آرگومان‌ها
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --install-only)
            check_nodejs
            check_npm
            install_dependencies
            create_results_dir
            success "نصب با موفقیت انجام شد"
            exit 0
            ;;
        --check-only)
            check_services
            exit 0
            ;;
        --clean)
            clean_results
            exit 0
            ;;
        --all-tests)
            check_nodejs
            check_npm
            install_dependencies
            create_results_dir
            check_services
            log "اجرای تمام تست‌ها..."
            node run-all-tests.js
            show_results
            exit 0
            ;;
        --api-tests)
            check_nodejs
            check_npm
            install_dependencies
            create_results_dir
            log "اجرای تست‌های API..."
            node api-test-suite.js
            show_results
            exit 0
            ;;
        --integration-tests)
            check_nodejs
            check_npm
            install_dependencies
            create_results_dir
            log "اجرای تست‌های یکپارچگی..."
            node integration-test-suite.js
            show_results
            exit 0
            ;;
        --error-tests)
            check_nodejs
            check_npm
            install_dependencies
            create_results_dir
            log "اجرای تست‌های خطا..."
            node error-scenarios-test.js
            show_results
            exit 0
            ;;
        --auth-tests)
            check_nodejs
            check_npm
            install_dependencies
            create_results_dir
            log "اجرای تست احراز هویت..."
            node auth-flow-test.js
            show_results
            exit 0
            ;;
        "")
            # اجرای عادی با منوی تعاملی
            ;;
        *)
            error "آرگومان نامعتبر: $1"
            show_help
            exit 1
            ;;
    esac
    
    # مراحل اصلی
    check_nodejs
    check_npm
    install_dependencies
    create_results_dir
    clean_results
    check_services
    run_tests
    show_results
    
    success "تست‌ها با موفقیت انجام شدند!"
}

# اجرای تابع اصلی
main "$@"


