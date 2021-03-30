#!/usr/bin/env bash

set -e
set -x

yarn install
pushd ccurl || exit
rm mac/libccurl.dylib || true
rm lin64/libccurl.so || true
gcc -shared -o libccurl.so libccurl.cpp -O3 -lpthread -fPIC -std=c++11
mkdir -p lin64
cp libccurl.so lin64/
rm libccurl.so
popd || exit
yarn run compile:lin
find out
