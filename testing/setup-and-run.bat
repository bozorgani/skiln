@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM اسکریپت نصب و اجرای تست‌های LMS Bozorgani برای Windows
REM این اسکریپت تمام مراحل نصب و اجرا را خودکار انجام می‌دهد

title تست‌های LMS Bozorgani

REM تنظیم رنگ‌ها
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "PURPLE=[95m"
set "CYAN=[96m"
set "NC=[0m"

REM تابع لاگ
:log
echo %CYAN%[%date% %time%] %~1%NC%
goto :eof

:success
echo %GREEN%✅ %~1%NC%
goto :eof

:error
echo %RED%❌ %~1%NC%
goto :eof

:warning
echo %YELLOW%⚠️ %~1%NC%
goto :eof

:info
echo %BLUE%ℹ️ %~1%NC%
goto :eof

:header
echo.
echo %PURPLE%%~1%NC%
echo ============================================================
goto :eof

REM بررسی وجود Node.js
:check_nodejs
call :log "بررسی Node.js..."
node --version >nul 2>&1
if errorlevel 1 (
    call :error "Node.js نصب نیست. لطفاً ابتدا Node.js را نصب کنید."
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
call :success "Node.js نصب است: !NODE_VERSION!"
goto :eof

REM بررسی وجود npm
:check_npm
call :log "بررسی npm..."
npm --version >nul 2>&1
if errorlevel 1 (
    call :error "npm نصب نیست."
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
call :success "npm نصب است: !NPM_VERSION!"
goto :eof

REM نصب dependencies
:install_dependencies
call :header "📦 نصب Dependencies"
call :log "نصب dependencies تست..."

npm install
if errorlevel 1 (
    call :error "خطا در نصب dependencies"
    pause
    exit /b 1
)

call :success "Dependencies با موفقیت نصب شدند"
goto :eof

REM ایجاد پوشه نتایج
:create_results_dir
call :log "ایجاد پوشه نتایج..."
if not exist "test-results" mkdir test-results
call :success "پوشه test-results ایجاد شد"
goto :eof

REM بررسی وضعیت سرویس‌ها
:check_services
call :header "🔍 بررسی وضعیت سرویس‌ها"

REM Backend API
call :log "بررسی Backend API..."
curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    call :warning "Backend API (پورت 5000) در دسترس نیست"
    call :info "برای راه‌اندازی Backend: cd ../backend && npm run dev"
) else (
    call :success "Backend API (پورت 5000) در حال اجرا است"
)

REM Frontend
call :log "بررسی Frontend..."
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    call :warning "Frontend (پورت 3000) در دسترس نیست"
    call :info "برای راه‌اندازی Frontend: cd ../frontend && npm run dev"
) else (
    call :success "Frontend (پورت 3000) در حال اجرا است"
)

REM Admin Panel
call :log "بررسی Admin Panel..."
curl -s http://localhost:3001 >nul 2>&1
if errorlevel 1 (
    call :warning "Admin Panel (پورت 3001) در دسترس نیست"
    call :info "برای راه‌اندازی Admin Panel: cd ../admin-panel && npm run dev"
) else (
    call :success "Admin Panel (پورت 3001) در حال اجرا است"
)
goto :eof

REM اجرای تست‌های مختلف
:run_tests
call :header "🧪 اجرای تست‌ها"

echo لطفاً نوع تست مورد نظر را انتخاب کنید:
echo 1^) تمام تست‌ها
echo 2^) فقط تست‌های API
echo 3^) فقط تست‌های یکپارچگی
echo 4^) فقط تست‌های خطا
echo 5^) فقط تست احراز هویت
echo 6^) خروج
echo.

set /p choice="انتخاب شما (1-6): "

if "%choice%"=="1" (
    call :log "اجرای تمام تست‌ها..."
    node run-all-tests.js
) else if "%choice%"=="2" (
    call :log "اجرای تست‌های API..."
    node api-test-suite.js
) else if "%choice%"=="3" (
    call :log "اجرای تست‌های یکپارچگی..."
    node integration-test-suite.js
) else if "%choice%"=="4" (
    call :log "اجرای تست‌های خطا..."
    node error-scenarios-test.js
) else if "%choice%"=="5" (
    call :log "اجرای تست احراز هویت..."
    node auth-flow-test.js
) else if "%choice%"=="6" (
    call :info "خروج از برنامه"
    exit /b 0
) else (
    call :error "انتخاب نامعتبر"
    pause
    exit /b 1
)
goto :eof

REM نمایش نتایج
:show_results
call :header "📊 نتایج تست‌ها"

if exist "test-results\*.*" (
    call :log "فایل‌های گزارش موجود:"
    dir /b test-results\
    
    REM یافتن آخرین گزارش HTML
    for /f "delims=" %%i in ('dir /b /o-d test-results\*.html 2^>nul') do (
        set "LATEST_HTML=test-results\%%i"
        goto :found_html
    )
    
    :found_html
    if defined LATEST_HTML (
        call :info "آخرین گزارش HTML: !LATEST_HTML!"
        
        set /p open_report="آیا می‌خواهید گزارش HTML را باز کنید؟ (y/n): "
        if /i "!open_report!"=="y" (
            start "" "!LATEST_HTML!"
        )
    )
) else (
    call :warning "هیچ گزارشی یافت نشد"
)
goto :eof

REM پاک کردن نتایج قدیمی
:clean_results
if exist "test-results\*.*" (
    set /p clean_old="آیا می‌خواهید نتایج قدیمی را پاک کنید؟ (y/n): "
    if /i "!clean_old!"=="y" (
        del /q test-results\*.json test-results\*.html test-results\*.png 2>nul
        call :success "نتایج قدیمی پاک شدند"
    )
)
goto :eof

REM نمایش راهنما
:show_help
echo استفاده: %~nx0 [OPTIONS]
echo.
echo گزینه‌ها:
echo   --help              نمایش این راهنما
echo   --install-only      فقط نصب dependencies
echo   --check-only        فقط بررسی وضعیت سرویس‌ها
echo   --clean             پاک کردن نتایج قدیمی
echo   --all-tests         اجرای تمام تست‌ها بدون سوال
echo   --api-tests         اجرای فقط تست‌های API
echo   --integration-tests اجرای فقط تست‌های یکپارچگی
echo   --error-tests       اجرای فقط تست‌های خطا
echo   --auth-tests        اجرای فقط تست احراز هویت
echo.
echo مثال‌ها:
echo   %~nx0                  اجرای کامل با منوی تعاملی
echo   %~nx0 --all-tests      اجرای تمام تست‌ها
echo   %~nx0 --api-tests      اجرای فقط تست‌های API
echo   %~nx0 --clean          پاک کردن نتایج قدیمی
goto :eof

REM تابع اصلی
:main
call :header "🎯 راه‌اندازی تست‌های LMS Bozorgani"

REM بررسی آرگومان‌ها
if "%~1"=="--help" goto :show_help
if "%~1"=="-h" goto :show_help

if "%~1"=="--install-only" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_results_dir
    call :success "نصب با موفقیت انجام شد"
    pause
    exit /b 0
)

if "%~1"=="--check-only" (
    call :check_services
    pause
    exit /b 0
)

if "%~1"=="--clean" (
    call :clean_results
    pause
    exit /b 0
)

if "%~1"=="--all-tests" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_results_dir
    call :check_services
    call :log "اجرای تمام تست‌ها..."
    node run-all-tests.js
    call :show_results
    pause
    exit /b 0
)

if "%~1"=="--api-tests" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_results_dir
    call :log "اجرای تست‌های API..."
    node api-test-suite.js
    call :show_results
    pause
    exit /b 0
)

if "%~1"=="--integration-tests" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_results_dir
    call :log "اجرای تست‌های یکپارچگی..."
    node integration-test-suite.js
    call :show_results
    pause
    exit /b 0
)

if "%~1"=="--error-tests" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_results_dir
    call :log "اجرای تست‌های خطا..."
    node error-scenarios-test.js
    call :show_results
    pause
    exit /b 0
)

if "%~1"=="--auth-tests" (
    call :check_nodejs
    call :check_npm
    call :install_dependencies
    call :create_results_dir
    call :log "اجرای تست احراز هویت..."
    node auth-flow-test.js
    call :show_results
    pause
    exit /b 0
)

if not "%~1"=="" (
    call :error "آرگومان نامعتبر: %~1"
    call :show_help
    pause
    exit /b 1
)

REM مراحل اصلی
call :check_nodejs
if errorlevel 1 exit /b 1

call :check_npm
if errorlevel 1 exit /b 1

call :install_dependencies
if errorlevel 1 exit /b 1

call :create_results_dir
call :clean_results
call :check_services
call :run_tests
call :show_results

call :success "تست‌ها با موفقیت انجام شدند!"
pause
goto :eof

REM اجرای تابع اصلی
call :main %*


