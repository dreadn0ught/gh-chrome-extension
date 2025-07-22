#!/usr/bin/env bash
set -euxo pipefail

# 0. Git Config
sudo apt-get update && sudo apt-get install -y git-lfs
git config --global push.default current
git config pull.rebase false


# 1. Install bun
curl -fsSL https://bun.sh/install | bash

# 2. Add bun to PATH
echo 'export PATH=$HOME/.bun/bin:$PATH' >> "$HOME/.bashrc"

# 3. Install uvx (the MCP runner)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 4. Install SAM
sudo apt-get update
sudo apt-get install -y unzip curl
curl -Lo aws-sam-cli-linux-x86_64.zip https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
sam --version
rm -rf aws-sam-cli-linux-x86_64.zip sam-installation/