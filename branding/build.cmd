@echo off

RMDIR home /S /Q
del /F /Q home.zip
xcopy ..\docs home /h/i/c/k/e/r/y/s
xcopy templates\home home /h/i/c/k/e/r/y/s
cd home
"C:\Program Files\7-Zip\7z" a -tzip ..\home.zip *

cd \Projects\Ignite\Pade\branding

RMDIR work /S /Q
del /F /Q work.zip
xcopy ..\docs work /h/i/c/k/e/r/y/s
xcopy templates\work work /h/i/c/k/e/r/y/s
cd work
"C:\Program Files\7-Zip\7z" a -tzip ..\work.zip *

pause