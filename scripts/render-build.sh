#!/usr/bin/env bash
set -euo pipefail

npm ci --prefix server
npm ci --prefix client
npm run build --prefix client
