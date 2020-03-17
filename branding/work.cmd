@echo off

cd \Projects\Ignite\Pade\branding

RMDIR work /S /Q
del /F /Q work.zip
xcopy ..\docs work /h/i/c/k/e/r/y/s
xcopy templates\work work /h/i/c/k/e/r/y/s
cd work
"C:\Program Files\7-Zip\7z" a -tzip ..\work.zip *


pause