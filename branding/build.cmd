@echo off

RMDIR home /S /Q
del /F /Q home.zip
xcopy ..\extension home /h/i/c/k/e/r/y/s
xcopy templates\home home /h/i/c/k/e/r/y/s
cd home
"C:\Program Files\7-Zip\7z" a -tzip ..\home.zip *
cd ..

RMDIR work /S /Q
del /F /Q work.zip
xcopy ..\extension work /h/i/c/k/e/r/y/s
xcopy templates\work work /h/i/c/k/e/r/y/s
cd work
"C:\Program Files\7-Zip\7z" a -tzip ..\work.zip *
cd ..

pause