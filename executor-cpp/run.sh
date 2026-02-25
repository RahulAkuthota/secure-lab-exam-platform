#!/bin/sh
set -e

g++ main.cpp -o main
if [ -f /sandbox/.stdin ]; then
  ./main < /sandbox/.stdin
else
  ./main
fi
