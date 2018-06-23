; -- pade.stream.deck setup/installer for windows --

[Setup]
AppName=Pade Stream Deck
AppPublisher=Ignite Realtime
AppPublisherURL=http://igniterealtime.org/
AppReadmeFile=http://igniterealtime.github.io/Pade/
AppVersion=0.1
DefaultDirName={sd}\pade_stream_deck
UninstallDisplayIcon={app}\pade.stream.deck.ico
OutputDir=.


[Files]
Source: "pade.stream.deck.json"; DestDir: "{app}"
Source: "pade.stream.deck.ico"; DestDir: "{app}"
Source: "pade.stream.deck.cmd"; DestDir: "{app}";
Source: "jackson-annotations-2.8.4.jar"; DestDir: "{app}";
Source: "jackson-core-2.8.4.jar"; DestDir: "{app}";
Source: "jackson-databind-2.8.4.jar"; DestDir: "{app}";
Source: "jna-4.2.2.jar"; DestDir: "{app}";
Source: "hid4java-0.5.0-modified.jar"; DestDir: "{app}";
Source: "streamdeckjava-0.1.0.jar"; DestDir: "{app}";

Source: "org\ifsoft\protocol\NativeRequest.class"; DestDir: "{app}\org\ifsoft\protocol";
Source: "org\ifsoft\protocol\NativeResponse.class"; DestDir: "{app}\org\ifsoft\protocol";
Source: "org\ifsoft\protocol\StreamDeck$1.class"; DestDir: "{app}\org\ifsoft\protocol";
Source: "org\ifsoft\protocol\StreamDeck.class"; DestDir: "{app}\org\ifsoft\protocol";

[Registry]
Root: HKLM; Subkey: "SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts\pade.stream.deck"; ValueType: string; ValueData: "{app}\pade.stream.deck.json"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\Google\Chrome\NativeMessagingHosts\pade.stream.deck"; ValueType: string; ValueData: "{app}\pade.stream.deck.json"; Flags: uninsdeletekey
