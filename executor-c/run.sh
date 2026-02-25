#!/bin/sh
set -e

gcc main.c -o main
if [ -f /sandbox/.stdin ]; then
  ./main < /sandbox/.stdin
else
  ./main
fi
