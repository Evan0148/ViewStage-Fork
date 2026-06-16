@echo off
@setlocal enableextensions
rem @cd /d "%~dp0\..\"

rem VS 2026
if exist "%ProgramFiles%\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" (
	call "%ProgramFiles%\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" amd64_arm64
	goto start
)

if exist "%ProgramFiles%\Microsoft Visual Studio\18\Professional\VC\Auxiliary\Build\vcvarsall.bat" (
	call "%ProgramFiles%\Microsoft Visual Studio\18\Professional\VC\Auxiliary\Build\vcvarsall.bat" amd64_arm64
	goto start
)

rem VS 2022
if exist "%ProgramFiles%\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" (
	call "%ProgramFiles%\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvarsall.bat" amd64_arm64
	goto start
)

if exist "%ProgramFiles%\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvarsall.bat" (
	call "%ProgramFiles%\Microsoft Visual Studio\2022\Professional\VC\Auxiliary\Build\vcvarsall.bat" amd64_arm64
	goto start
)

echo Visual Studio 2022/2026 was not found...

goto end

:start

msbuild memreduct.sln -property:Configuration=Release -property:Platform=x64 -verbosity:normal

:end

echo done...

pause
