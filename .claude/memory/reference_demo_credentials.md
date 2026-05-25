---
name: reference-demo-credentials
description: Seeded demo user creds for local dev login. Avoids re-reading seed_demo.py.
metadata: 
  node_type: memory
  type: reference
  originSessionId: b2264f4f-9059-478a-a23d-9284f44ef563
---

# Demo seed credentials

Source: `server/scripts/seed_demo.py`. Seed populates 6 users via signup, then each posts a synthetic run near Seattle.

All share password: **`secretsecret`**

Login form uses **email + password** (not username).

| Email             | Username       |
|-------------------|----------------|
| demo_a@test.com   | demo_alpha     |
| demo_b@test.com   | demo_bravo     |
| demo_c@test.com   | demo_charlie   |
| demo_d@test.com   | demo_delta     |
| demo_e@test.com   | demo_echo      |
| demo_f@test.com   | demo_foxtrot   |

Run seed: `python server/scripts/seed_demo.py` against running backend (idempotent — login_or_signup pattern).

Related: [[reference-local-infra]] · [[project-stack-snapshot]]
