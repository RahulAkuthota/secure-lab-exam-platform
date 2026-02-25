#!/bin/sh
set -e

javac Main.java
if [ -f /sandbox/.stdin ]; then
  java Main < /sandbox/.stdin
else
  java Main
fi
