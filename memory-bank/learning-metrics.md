# Learning Metrics

## Configuration

| Setting | Value | Description |
|---------|-------|-------------|
| Max learned rule files | 10 | Hard cap on files in `agent-rules/_learned/` |
| Expiry period (days) | 90 | Remove unreinforced bullets after this period |
| Promotion threshold | 3 | Promote to `medium` priority at this evidence count |
| Max bullets per file | 15 | Prune to 10 most-evidenced when exceeded |

## Task History

| Task ID | Date | Learnings Extracted | Rules Amended | Rules Created |
|---------|------|--------------------:|-------------:|-------------:|
| TASK-001 | 2026-05-19 (backfill) | 4 | 0 | 0 |
| TASK-002 | 2026-05-19 (backfill) | 3 | 0 | 0 |
| TASK-003 | 2026-05-19 (backfill) | 4 | 0 | 0 |
| TASK-004 | 2026-05-19 (backfill) | 3 | 0 | 0 |
| TASK-005 | 2026-05-19 (backfill) | 6 | 0 | 0 |
| TASK-006 | 2026-05-19 (backfill) | 3 | 0 | 0 |
| TASK-007 | 2026-05-19 (backfill) | 6 | 0 | 0 |
| **Backfill total** | 2026-05-19 | **29** | **0** | **4** |

## Rule Effectiveness

| File | Topics | Evidence Count | Priority | Last Updated |
|------|--------|---------------:|:--------:|:------------:|
| _learned/testing-patterns.md | testing, vitest, pytest | 7 | low | 2026-05-19 |
| _learned/react-cleanup.md | react, useeffect, memory-leak | 2 | low | 2026-05-19 |
| _learned/security.md | security, cwe, logging | 2 | medium | 2026-05-19 |
| _learned/tailwind-port.md | tailwind, css, stitch, design-system | 3 | low | 2026-05-19 |

## Consolidation History

| Date | Rules Before | Rules After | Merged | Expired | Promoted |
|------|------------:|------------:|-------:|--------:|---------:|
| 2026-05-19 (backfill) | 0 | 4 | 0 | 0 | 1 (security: low→medium) |

## Notes

- `security.md` was promoted to `medium` priority on creation because the rules cover CWE-209 (info exposure) and credential-leak surfaces — not appropriate for `low` regardless of evidence count.
- `testing-patterns.md` is at 7 evidence points but kept at `low` because rules are conventions, not invariants. Next reinforcement should promote.
- `_learned/` currently holds 4 files; 6 slots remain before the max-10 cap triggers consolidation.
