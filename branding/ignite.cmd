@echo off

RMDIR ignite /S /Q
del /F /Q ignite.zip
xcopy ..\extension ignite /h/i/c/k/e/r/y/s
xcopy templates\ignite ignite /h/i/c/k/e/r/y/s
cd ignite
"C:\Program Files\7-Zip\7z" a -tzip ..\ignite.zip *
cd ..

pause