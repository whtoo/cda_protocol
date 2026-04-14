# OpenClaw GitHub Issues 狙击手册

> 最高 ROI 的分发渠道。去别人喊疼的地方贴创可贴。

## 为什么这里最有效

- OpenClaw 官方仓库每天有数千开发者浏览
- Issue 里的求助者都是**精准的上下文管理痛点用户**
- 你的回复会永久留存在搜索引擎里，持续带来流量
- 订阅 issue 的人会收到**邮件通知**

## 目标搜索链接（直接点）

1. **context / memory 相关**: https://github.com/openclaw/openclaw/issues?q=is%3Aissue+context+memory
2. **crash / overflow 相关**: https://github.com/openclaw/openclaw/issues?q=is%3Aissue+crash+overflow
3. **compact / forget 相关**: https://github.com/openclaw/openclaw/issues?q=is%3Aissue+compact+forget
4. **assemble / basic 相关**: https://github.com/openclaw/openclaw/issues?q=is%3Aissue+assemble+basic

## 回复模板（直接复制）

### 模板 A：对「agent 失忆/重复错误」型 issue

> We just shipped a CDA Protocol skill for OpenClaw and ran it for 72+ hours without a single context crash or session reboot.
>
> Current telemetry: **10.39% message retention**, **8.72% key-entity retention**, context usage stable at 28-40%.
>
> The root cause of most "memory loss" issues isn't the model — it's that `assemble: basic` dumps 100% of messages into context, eventually hitting gateway emergency compression in a loop. The agent isn't forgetting; it's drowning.
>
> CDA replaces `assemble: basic` with phase-aware direction alignment. Failed reasoning directions get logged as `miss` and filtered out in future `assemble` rounds.
>
> Repo: https://github.com/whtoo/cda_protocol  
> Includes an OpenClaw-compatible `skill/` manifest and `SOUL.md` for agents.

### 模板 B：对「context overflow / 111% usage」型 issue

> Same pattern here. We traced our context overflow to `assemble: basic` importing 839 messages (100%) into a 204K budget, hitting 111.9% usage and triggering 6 emergency compressions in 3 minutes.
>
> After switching to CDA:
> - Messages retained: **10.39%**
> - Key entities preserved: **8.72%**
> - Context usage: **28-40% stable**
> - Session uptime: **72+ hours zero crashes**
>
> The fix wasn't a bigger window. It was aligning the *direction* of what gets assembled.
>
> https://github.com/whtoo/cda_protocol

### 模板 C：对「long session drift」型 issue

> We solved this exact drift problem with a negative guarantee instead of a positive one.
>
> CDA doesn't try to "find the right path" on the first try. It guarantees you **won't trip over the same dead end twice**. Every failed direction is logged as a `miss` and its weight decays in the next `assemble`.
>
> Real numbers from our production OpenClaw session:
> - Stable past **1,200+ turns**
> - **10.39%** of original messages retained
> - **8.72%** key-entity preservation via SCG topology compression
>
> If you're hitting drift at turn 500+, this is likely a direction alignment problem, not a model problem.
>
> https://github.com/whtoo/cda_protocol

## 行动清单

```
□ 1. 打开 https://github.com/openclaw/openclaw/issues
□ 2. 用上面的搜索链接过滤最近 30 天的 issue
□ 3. 每天回复 3-5 个相关 issue（不要 spam，只回真正相关的）
□ 4. 同时订阅这些 issue，以便后续跟进讨论
```

## 注意事项

- **不要**在无关 issue 下回复（会被 flag 为 spam）
- **不要**只丢链接，要针对 issue 的具体症状给出一句话诊断
- 如果有人追问细节，回复时引用 `cda-book-en.md` 第 3 章的实验日志
