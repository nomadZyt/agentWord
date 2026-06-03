# 参与贡献

感谢你对 agentWord 的关注！

## 开始之前

1. 搜索 [Issues](https://github.com/nomadZyt/agentWord/issues)，避免重复提交
2. 较大改动请先开 Issue 讨论方向
3. 阅读 [README.md](./README.md) 中的隐私边界 —— 贡献不应引入终端正文采集或远程遥测

## 本地开发

```bash
pnpm install
pnpm tauri dev
```

提交前建议运行：

```bash
pnpm typecheck
```

## Pull Request

- 保持改动聚焦，说明动机与测试方式
- 不要提交 `node_modules/`、`dist/`、`src-tauri/target/`、`.playwright-cli/` 等（已在 `.gitignore` 中）
- 新增二进制大文件请说明用途；优先使用仓库内已有的素材管线

## 行为准则

请尊重他人，就事论事。维护者保留拒绝不符合项目目标的 PR 的权利。
