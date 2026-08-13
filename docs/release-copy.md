# Release Copy

This file keeps user-facing release copy for Douban diary posts and store submissions. Update the latest version block for every release.

## v0.1.5 - 2026-07-27

### Chrome Web Store Release Notes

Chinese:

```text
v0.1.5 更新：
- 修复从豆瓣搜索页进入新建条目页时可能沿用过期候选唱片的问题。
- 只有唯一精确匹配或唯一搜索结果会自动预填，模糊或失败的查询不会改动表单。
- 完成流程后会清理候选状态，减少后续操作串用上一张唱片的信息。
- 增加 9 个行为测试，覆盖 URL 优先级、匹配选择、失败/歧义处理和状态清理。
```

English:

```text
v0.1.5:
- Fixed stale album candidates carrying from a Douban search into a new-subject page.
- Auto-fill now occurs only for a unique exact match or a sole result; ambiguous and failed lookups leave the form unchanged.
- Candidate state is cleared after the flow completes to prevent reuse in later actions.
- Added nine behavior tests for query priority, candidate selection, failure and ambiguity handling, and cleanup.
```

### Release Facts

- Chrome Web Store release date: 2026-07-27.
- Manifest and package version: `0.1.5`.
- Upload package: `Douban New Subject-0.1.5.zip`.
- SHA-256: `2270a96670ec0b226ab5a60cab1377ae28c1661b47bc8c6c5ec15aab1f9c572d`.
- Store users must be recorded as a dated Chrome Web Store user figure, never as downloads or GitHub adoption.

## v0.1.4 - 2026-05-08

### Douban Diary Draft

标题：

```text
豆瓣音乐新条目助手更新：古典唱片搜索更稳了
```

正文：

```text
最近继续打磨了一下“豆瓣音乐新条目助手”。这次更新主要不是加新按钮，而是把最容易卡住的搜索链路做稳：在豆瓣音乐里准备创建新条目时，侧边栏会更可靠地从 Presto Music 找到对应唱片，尤其是古典音乐里常见的作品编号、演奏者角色、标点差异和同名不同版录音。

这版重点改了几件事：

1. Presto 搜索改用更稳定的搜索接口，并保留兜底逻辑。
2. 查询失败时会自动清理一部分干扰词，例如演奏者括号角色，以及 Op. / No. / D. / K. / BWV 等作品编号。
3. 豆瓣已有条目的判断更谨慎，减少把同名但不是同一张唱片的结果误判为“已存在”。
4. 支持豆瓣全站音乐搜索页的使用场景。
5. 加了本地和 GitHub Actions 的质量检查，发版前会自动检查语法、manifest、权限、敏感信息和常见危险 API。

目前封面还是保持自动下载、手动上传。我的目标不是全自动提交，而是把查资料、填字段、找封面的重复劳动压缩掉，最终提交前仍然由人确认。

这次商店包版本是 v0.1.4。后面每次发版我会继续记录这类更新说明，方便自己回看，也方便同步到 Chrome Web Store。
```

### Short Douban Diary Draft

```text
豆瓣音乐新条目助手更新到 v0.1.4。

这版主要把古典唱片的 Presto 搜索链路做稳：改用更稳定的搜索接口，增加作品编号和演奏者角色的清理兜底，也让豆瓣已有条目的匹配更谨慎，减少同名不同版录音带来的误判。

另外加了本地和 GitHub Actions 的质量检查，之后发版前会自动检查语法、manifest、权限和常见风险。封面仍然是自动下载、手动上传，提交前保留人工确认。
```

### Chrome Web Store Release Notes

Chinese:

```text
v0.1.4 更新：
- 提升 Presto Music 搜索稳定性，古典唱片查询失败时会自动清理演奏者角色、标点和常见作品编号。
- 优化豆瓣已有条目匹配，减少同名不同唱片的误判。
- 支持豆瓣全站音乐搜索页。
- 增加发版前质量检查，覆盖语法、manifest、权限和常见风险。
```

English:

```text
v0.1.4:
- Improved Presto Music search reliability for classical releases, with fallback query cleanup for performer roles, punctuation, and common work numbers.
- Tightened Douban match detection to reduce false positives from same-title releases.
- Added support for Douban's general music search page.
- Added pre-release quality checks for syntax, manifest metadata, permissions, and common risks.
```

### One-Line Store Summary

```text
Improves Presto search reliability and Douban match accuracy for classical music subject creation.
```

### Notes For Submission

- Upload package: `Douban New Subject-0.1.4.zip`
- Manifest version: `0.1.4`
- Package version: `0.1.4`
- Manual limitation to keep clear: cover upload is still manual after the extension downloads the cover.

## Future Release Template

### vX.Y.Z - YYYY-MM-DD

#### Douban Diary Draft

```text
标题：
豆瓣音乐新条目助手更新：<一句话主题>

正文：
这次更新主要解决 <用户能感知的问题>。

这版重点改了几件事：

1. <变化 1：从用户效果写，不只写实现>
2. <变化 2>
3. <变化 3>

目前仍然保留 <限制或需要人工确认的地方>。这版商店包版本是 vX.Y.Z。
```

#### Chrome Web Store Release Notes

```text
vX.Y.Z 更新：
- <用户可理解的变化 1>
- <用户可理解的变化 2>
- <稳定性/修复/安全检查等变化>
```

#### Submission Checklist

- [ ] `manifest.json` version matches the release version.
- [ ] `package.json` version matches the release version.
- [ ] The release ZIP filename includes the release version.
- [ ] The ZIP `manifest.json` reports the same version.
- [ ] `npm test` passes.
- [ ] Store release notes avoid internal-only details and mention user-visible impact.
- [ ] Douban diary copy explains why the change matters, not just what changed.
