@echo off
setlocal enabledelayedexpansion
echo.
echo ================================
echo    Git Commit Helper Script
echo ================================
echo.
REM Show current git status and changes
echo Checking git status...
git status
echo.
echo Current changes:
echo ----------------
git diff --name-status
echo.
REM Show detailed diff
echo Detailed changes:
echo -----------------
git diff
echo.
REM Ask for confirmation to proceed
:confirm_edits
set /p "proceed=Do you want to proceed with these changes? (y/n): "
if /i "!proceed!"=="n" (
    echo Operation cancelled.
    pause
    exit /b 0
)
if /i "!proceed!"=="y" goto add_files
echo Please enter 'y' for yes or 'n' for no.
goto confirm_edits
:add_files
echo.
echo Running 'git add .'...
git add .
if errorlevel 1 (
    echo Error: Failed to add files to git.
    pause
    exit /b 1
)
echo Files added successfully.
echo.
REM Ask for commit message
:get_commit_message
set /p "commit_msg=Enter commit message (type 'EXIT' to quit): "
if /i "!commit_msg!"=="EXIT" (
    echo Operation cancelled by user.
    pause
    exit /b 0
)
if "!commit_msg!"=="" (
    echo Commit message cannot be empty. Please try again.
    goto get_commit_message
)
REM Confirm commit message
:confirm_commit_message
echo.
echo Commit message: "!commit_msg!"
set /p "confirm_msg=Is this commit message correct? (y/n): "
if /i "!confirm_msg!"=="n" goto get_commit_message
if /i "!confirm_msg!"=="y" goto do_commit
echo Please enter 'y' for yes or 'n' for no.
goto confirm_commit_message
:do_commit
echo.
echo Committing changes...
git commit -m "!commit_msg!"
if errorlevel 1 (
    echo Error: Failed to commit changes.
    pause
    exit /b 1
)
echo Commit successful.
echo.
echo Pushing to origin main...
git push origin main
if errorlevel 1 (
    echo Error: Failed to push to origin main.
    echo You may need to pull changes first or check your remote configuration.
    pause
    exit /b 1
)
echo.
echo ================================
echo   All operations completed!
echo ================================
echo Changes have been committed and pushed to origin main.
echo.
pause
