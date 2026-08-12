# ============================================
# CPSP UI/UX Implementation Script
# Run this in your CPSP project folder
# ============================================

Write-Host "🚀 Starting CPSP UI/UX Implementation..." -ForegroundColor Green
Write-Host ""

# Get Downloads folder path
$DownloadsPath = "$env:USERPROFILE\Downloads"
$ProjectRoot = Get-Location

Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Cyan
Write-Host "📁 Downloads: $DownloadsPath" -ForegroundColor Cyan
Write-Host ""

# Function to copy file with error handling
function Copy-FileWithCheck {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Description
    )
    
    if (Test-Path $Source) {
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "✅ $Description" -ForegroundColor Green
    } else {
        Write-Host "❌ $Description - FILE NOT FOUND: $Source" -ForegroundColor Red
    }
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📋 Step 1: Copying Component Files" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path "src\components")) {
    New-Item -ItemType Directory -Path "src\components" -Force | Out-Null
}

Copy-FileWithCheck "$DownloadsPath\WelcomeBanner.tsx" "src\components\WelcomeBanner.tsx" "Copied WelcomeBanner.tsx"
Copy-FileWithCheck "$DownloadsPath\HistoryPageComponent.tsx" "src\components\HistoryPageComponent.tsx" "Copied HistoryPageComponent.tsx"
Copy-FileWithCheck "$DownloadsPath\SkippedQuestionCard.tsx" "src\components\SkippedQuestionCard.tsx" "Copied SkippedQuestionCard.tsx"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🎨 Step 2: Appending CSS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

$CSSSource = "$DownloadsPath\globals_CSS_ADDITIONS.css"
$CSSTarget = "src\app\globals.css"

if (Test-Path $CSSSource) {
    Add-Content -Path $CSSTarget -Value "`n`n/* UI/UX Enhancement CSS - Added $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') */`n" -Encoding UTF8
    Add-Content -Path $CSSTarget -Value (Get-Content $CSSSource) -Encoding UTF8
    Write-Host "✅ Appended globals_CSS_ADDITIONS.css to globals.css" -ForegroundColor Green
} else {
    Write-Host "❌ CSS file not found: $CSSSource" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🗄️  Step 3: Copying SQL Migration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Copy-FileWithCheck "$DownloadsPath\database_migration.sql" "database_migration.sql" "Copied database_migration.sql"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📚 Step 4: Copying Documentation" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

if (!(Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" -Force | Out-Null
}

Copy-FileWithCheck "$DownloadsPath\CPSP_UI_UX_IMPLEMENTATION_PLAN.md" "docs\CPSP_UI_UX_IMPLEMENTATION_PLAN.md" "Copied Implementation Plan"
Copy-FileWithCheck "$DownloadsPath\IMPLEMENTATION_GUIDE.md" "docs\IMPLEMENTATION_GUIDE.md" "Copied Implementation Guide"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🔗 Step 5: Git Commit & Push" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "Checking git status..." -ForegroundColor Cyan
git status
Write-Host ""

Write-Host "Adding files..." -ForegroundColor Cyan
git add .
Write-Host "✅ Files added" -ForegroundColor Green
Write-Host ""

Write-Host "Committing..." -ForegroundColor Cyan
git commit -m "feat: UI/UX enhancement - colorful cards, green theme, delete/view icons, welcome banner, skipped questions display"
Write-Host "✅ Committed" -ForegroundColor Green
Write-Host ""

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main
Write-Host "✅ Pushed to main branch" -ForegroundColor Green
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "🎉 Implementation Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "✨ Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run database migration in Supabase (database_migration.sql)" -ForegroundColor White
Write-Host "2. Update your page components with server data fetching" -ForegroundColor White
Write-Host "3. Test on mobile, tablet, and desktop" -ForegroundColor White
Write-Host "4. Deploy to Vercel" -ForegroundColor White
Write-Host ""