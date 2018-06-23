; -- pade.jabra setup/installer for windows --

[Setup]
AppName=Pade Jabra Device
AppPublisher=Ignite Realtime
AppPublisherURL=http://igniterealtime.org/
AppReadmeFile=http://igniterealtime.github.io/Pade/
AppVersion=0.1
DefaultDirName={sd}\pade_jabra
UninstallDisplayIcon={app}\pade.jabra.ico
OutputDir=.


[Files]
Source: "pade.jabra.json"; DestDir: "{app}"
Source: "pade.jabra.ico"; DestDir: "{app}"
Source: "jabrachromehost.exe"; DestDir: "{app}";
Source: "libjabra.dll"; DestDir: "{app}";

[Registry]
Root: HKLM; Subkey: "SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts\pade.igniterealtime.org"; ValueType: string; ValueData: "{app}\pade.jabra.json"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\Google\Chrome\NativeMessagingHosts\pade.igniterealtime.org"; ValueType: string; ValueData: "{app}\pade.jabra.json"; Flags: uninsdeletekey
