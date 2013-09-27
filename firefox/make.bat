@echo off

if exist "qts@moongiraffe.net.xpi" (
   del "qts@moongiraffe.net.xpi"
)

if exist "C:\Program Files\7-zip\7z.exe" (
    set zip="C:\Program Files\7-zip\7z.exe"
) else (
    set zip="C:\Program Files (x86)\7-zip\7z.exe"
)

if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    set firefox="C:\Program Files\Mozilla Firefox\firefox.exe"
) else (
    set firefox="C:\Program Files (x86)\Mozilla Firefox\firefox.exe"
)

%zip% a -r -tzip qts@moongiraffe.net.xpi bootstrap.js ChangeLog install.rdf icon.png options.xul

%firefox% qts@moongiraffe.net.xpi
