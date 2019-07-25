@echo off

RMDIR home /S /Q
del /F /Q home.zip
xcopy ..\extension home /h/i/c/k/e/r/y/s
xcopy templates\home home /h/i/c/k/e/r/y/s
cd home
"C:\Program Files\7-Zip\7z" a -tzip ..\home.zip *

cd \Projects\Ignite\Pade2\branding

RMDIR work /S /Q
del /F /Q work.zip
xcopy ..\extension work /h/i/c/k/e/r/y/s
xcopy templates\work work /h/i/c/k/e/r/y/s
cd work
"C:\Program Files\7-Zip\7z" a -tzip ..\work.zip *

cd \Projects\Ignite\Pade2\branding

RMDIR ignite /S /Q
del /F /Q ignite.zip
xcopy ..\extension ignite /h/i/c/k/e/r/y/s
xcopy templates\ignite ignite /h/i/c/k/e/r/y/s
cd ignite
"C:\Program Files\7-Zip\7z" a -tzip ..\ignite.zip *
cd ..

pause