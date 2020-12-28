# これはなに

- 下記ツールがインストールされたテスト環境を提供するためのDockerfile
  - yarn
  - openjdk
    - テストでFirebase Local Emulator Suiteを動作させるために必要
- Container Registryに登録しておくと、Cloud Buildでpullしてその中でテスト等を実行できるようになる
  - 逆に、未登録だとCIがFailする

# 使い方

- すでにGCPプロジェクトのContainer Registryに `yarn-openjdk` が登録済みであれば何もしなくてOK
- 未登録であれば下記コマンドを実行して登録する
  ```sh
  make push PJ=<project-id>
  ```
