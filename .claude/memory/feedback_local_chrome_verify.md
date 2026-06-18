---
name: feedback-local-chrome-verify
description: "Always verify code changes by running the app locally AND driving the feature in Chrome before opening a PR — unit tests/lint/build alone are not enough."
metadata:
  node_type: memory
  type: feedback
---

# Verify locally in Chrome before PR

For any code change, do NOT treat it as done after unit tests + lint + build pass. Also run the app locally and verify the change in the **Chrome browser** (claude-in-chrome MCP tools) by exercising the real UI behavior.

**Why:** User caught a PR being opened with only unit-test verification, no real-app check. Green tests ≠ working feature in the browser.

**How to apply:** After tests/lint/build pass, bring up the local stack (see [[reference-local-infra]], creds in [[reference-demo-credentials]]), open Chrome, drive the feature manually (capture a GIF for multi-step flows when useful). Do this BEFORE `gh pr create`. The `bug-fixer` subagent already follows this; mirror it for feature work too.
