#!/bin/bash
set -e

echo "Installing Python setuptools and wheel for swisseph..."
python3 -m pip install --user setuptools wheel

echo "Setting SETUPTOOLS_USE_DISTUTILS=stdlib..."
export SETUPTOOLS_USE_DISTUTILS=stdlib

echo "Running yarn install..."
yarn install --network-timeout 300000
