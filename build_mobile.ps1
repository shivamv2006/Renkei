# GENZOKU Mobile Packaging Script (Android APK & iOS)
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   GENZOKU MOBILE PACKAGING & SYNC        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

Write-Host "`n1. Running Next.js Export..." -ForegroundColor Yellow
$env:NEXT_EXPORT = "true"
npm.cmd run build

Write-Host "`n2. Syncing Capacitor Web Assets to Android & iOS..." -ForegroundColor Yellow
npx.cmd cap sync

Write-Host "`n3. Checking Android Build Environment..." -ForegroundColor Yellow
if ($env:JAVA_HOME -or (Get-Command java -ErrorAction SilentlyContinue)) {
    Write-Host "Java detected. Compiling Android Debug APK..." -ForegroundColor Green
    Set-Location -Path "$PSScriptRoot\android"
    .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[SUCCESS] Android APK built successfully at:" -ForegroundColor Green
        Write-Host "$PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
    } else {
        Write-Host "`n[NOTICE] Gradle compilation returned non-zero code. You can open 'android' in Android Studio to build APK." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[INFO] Java/Android SDK is not installed in system PATH." -ForegroundColor Yellow
    Write-Host "The Android project is completely generated and ready in:" -ForegroundColor White
    Write-Host "  $PSScriptRoot\android" -ForegroundColor Cyan
    Write-Host "To produce app-debug.apk:" -ForegroundColor White
    Write-Host "  1. Open Android Studio -> Open project '$PSScriptRoot\android'" -ForegroundColor White
    Write-Host "  2. Click Build -> Build Bundle(s) / APK(s) -> Build APK(s)" -ForegroundColor White
    Write-Host "  Or install OpenJDK 17 and run: cd android; .\gradlew.bat assembleDebug" -ForegroundColor White
}

Write-Host "`n[INFO] iOS project is completely generated and ready in:" -ForegroundColor White
Write-Host "  $PSScriptRoot\ios\App" -ForegroundColor Cyan
Write-Host "To run on iOS:" -ForegroundColor White
Write-Host "  Open '$PSScriptRoot\ios\App\App.xcworkspace' in Xcode and click Run." -ForegroundColor White
