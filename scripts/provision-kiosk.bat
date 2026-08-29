@echo off
echo ========================================================
echo  Signage 24h - Provisionamento Kiosk (Device Owner)
echo ========================================================
echo.
echo Certifique-se de que:
echo  1. O tablet esta conectado via USB com Depuracao USB ativada.
echo  2. O APK esta instalado no tablet.
echo  3. Nao ha contas Google/Samsung ativas no tablet (remova temporariamente se necessario).
echo.
pause

echo.
echo Aplicando permissao de Device Owner...
adb shell dpm set-device-owner com.signage24h.player/expo.modules.kiosk.DeviceAdminReceiver

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCESSO] Tablet provisionado com sucesso como Device Owner!
    echo O modo Kiosk agora bloqueia botoes Home, Voltar e barra de notificacoes.
) else (
    echo.
    echo [ERRO] Falha ao provisionar. Verifique se o dispositivo possui contas ativas em Configuracoes ^> Contas.
)

echo.
pause
