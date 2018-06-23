; -- pade.remote.control setup/installer for windows --

[Setup]
AppName=Pade Remote Control
AppVersion=0.1
DefaultDirName={sd}\pade_remote_control
UninstallDisplayIcon={app}\pade.remote.control.ico
OutputDir=.
AppPublisher=Ignite Realtime
AppPublisherURL=http://igniterealtime.org/

[Files]
Source: "pade.remote.control.json"; DestDir: "{app}"
Source: "pade.remote.control.ico"; DestDir: "{app}"
Source: "pade.remote.control.cmd"; DestDir: "{app}";
Source: "jackson-annotations-2.8.4.jar"; DestDir: "{app}";
Source: "jackson-core-2.8.4.jar"; DestDir: "{app}";
Source: "jackson-databind-2.8.4.jar"; DestDir: "{app}";
Source: "org\ifsoft\protocol\NativeRequest.class"; DestDir: "{app}\org\ifsoft\protocol";
Source: "org\ifsoft\protocol\NativeResponse.class"; DestDir: "{app}\org\ifsoft\protocol";
Source: "org\ifsoft\protocol\RemoteControl.class"; DestDir: "{app}\org\ifsoft\protocol";

[Registry]
Root: HKLM; Subkey: "SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts\pade.remote.control"; ValueType: string; ValueData: "{app}\pade.remote.control.json"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\Google\Chrome\NativeMessagingHosts\pade.remote.control"; ValueType: string; ValueData: "{app}\pade.remote.control.json"; Flags: uninsdeletekey
