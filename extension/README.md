# Deploying

Build the ZIP file for the Google Web Store Developer Dashboard like so:

zip -r <zip-name> <folder-location> -x <exclusions>

e.g.

zip -r pade.zip . -x *.git* -x *.iml -x *.DS_Store
