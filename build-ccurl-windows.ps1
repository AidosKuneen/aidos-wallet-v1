cd ccurl
call "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvars64.bat"
cl libccurl.cpp /LD /Ox
if (not exist "win64") { mkdir win64 }
copy libccurl.dll win64\
del libccurl.dll
call "C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\VC\Auxiliary\Build\vcvars32.bat"
cl libccurl.cpp /LD /Ox
if (not exist "win32") { mkdir win32 }
copy libccurl.dll win32\
del libccurl.dll
cd ..
