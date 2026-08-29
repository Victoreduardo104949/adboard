@echo off
echo ========================================================
echo  Signage 24h - Remover Device Owner (Deprovision)
echo ========================================================
echo.
echo Este script remove o status de Device Owner do app no tablet,
echo permitindo sua desinstalacao e liberando o sistema operacional.
echo.
pause

echo.
echo Removendo Device Owner...
adb shell dpm remove-active-admin com.signage24h.player/expo.modules.kiosk.DeviceAdminReceiver

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Modo Device Owner removido com sucesso!
) else (
    echo.
    echo [ERRO] Falha ao remover. Verifique se o tablet esta conectado via USB.
)

echo.
pause
