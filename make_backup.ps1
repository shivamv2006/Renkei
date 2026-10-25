param()
$ts = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
$dest = "C:\Games\GENZOKU_Backups\GENZOKU_Backup_" + $ts + ".zip"
if (!(Test-Path "C:\Games\GENZOKU_Backups")) {
    New-Item -ItemType Directory -Path "C:\Games\GENZOKU_Backups" -Force | Out-Null
}
Compress-Archive -Path "C:\Games\GENZOKU\src", "C:\Games\GENZOKU\supabase", "C:\Games\GENZOKU\package.json", "C:\Games\GENZOKU\tailwind.config.js", "C:\Games\GENZOKU\tsconfig.json" -DestinationPath $dest -CompressionLevel Fastest
Get-Item $dest | Select-Object FullName, Length
