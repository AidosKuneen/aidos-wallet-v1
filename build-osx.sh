#!/usr/bin/env bash

set -e
set -x

yarn install
pushd ccurl || exit
rm mac/libccurl.dylib || true
rm lin64/libccurl.so || true
gcc -dynamiclib -o libccurl.dylib libccurl.cpp -O3 -lpthread -std=c++11
mkdir -p mac
cp libccurl.dylib mac/
rm libccurl.dylib
popd || exit
yarn run compile:mac
find out
