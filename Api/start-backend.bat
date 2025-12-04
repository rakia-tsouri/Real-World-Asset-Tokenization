@echo off
echo ========================================
echo   Demarrage du Backend Flask
echo ========================================
echo.

REM Aller dans le dossier backend
cd /d "%~dp0"

echo [1/4] Verification de l'environnement virtuel...
if not exist "venv311\Scripts\activate.bat" (
    echo ❌ ERREUR: Environnement virtuel non trouve!
    echo    Creant l'environnement virtuel...
    python -m venv venv311
    if errorlevel 1 (
        echo ❌ Erreur lors de la creation de l'environnement virtuel
        pause
        exit /b 1
    )
)

echo [2/4] Activation de l'environnement virtuel...
call venv311\Scripts\activate.bat

echo [3/4] Verification des dependances...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo    Installation des dependances...
    pip install -r requirements.txt
)

echo [4/4] Verification du fichier .env...
if not exist ".env" (
    echo    ⚠️  Fichier .env non trouve
    echo    Creation depuis env.example...
    if exist "env.example" (
        copy env.example .env >nul
        echo    ✅ Fichier .env cree
        echo    ⚠️  IMPORTANT: Editez backend\.env et ajoutez votre OPENAI_API_KEY!
    ) else (
        echo    ❌ env.example non trouve
    )
)

echo.
echo ========================================
echo   Demarrage du serveur Flask...
echo ========================================
echo.
echo 🌐 Le backend sera accessible sur: http://localhost:5000
echo 🔍 Test: http://localhost:5000/api/health
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur
echo.

python app.py

pause


