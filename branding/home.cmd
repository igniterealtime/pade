@echo off

RMDIR home /S /Q
del /F /Q home.zip
xcopy ..\docs home /h/i/c/k/e/r/y/s
xcopy templates\home home /h/i/c/k/e/r/y/s
cd home
"C:\Program Files\7-Zip\7z" a -tzip ..\home.zip *

pause