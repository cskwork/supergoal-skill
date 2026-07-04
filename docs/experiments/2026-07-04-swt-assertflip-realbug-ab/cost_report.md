# Haiku 3-way — token & cost report

Model: **Claude Haiku 4.5** (`claude-haiku-4-5`). Pricing $/MTok: input **1.00**, output **5.00**, 5m cache-write **1.25** (1.25× input), cache-read **0.10** (0.1× input). Source: claude-api reference.

Per-arm totals aggregated from the 135 agent transcripts of workflow `wf_f53fc4e0-3d1` (45 agents/arm = 15 instances × R3). Token types summed separately because each is priced differently; prompt caching dominates (cache-read is 95% of raw tokens).

| arm | agents | input | cache-write | cache-read | output | raw tokens | **cost (USD)** |
|---|---|---|---|---|---|---|---|
| 0 (no-skill) | 45 | 14,576 | 4,896,738 | 104,992,185 | 323,759 | 110,227,258 | **$18.25** |
| B (shipped) | 45 | 11,754 | 4,082,659 | 81,742,171 | 239,139 | 86,075,723 | **$14.48** |
| A (assertflip) | 45 | 11,334 | 4,053,855 | 77,051,913 | 211,880 | 81,328,982 | **$13.84** |
| **TOTAL** | 135 | 37,664 | 13,033,252 | 263,786,269 | 774,778 | 277,631,963 | **$46.58** |

Avg $0.345/agent, $3.11/instance (15).

**Note — no-skill is the most expensive arm.** Without a method to follow, the haiku no-skill agents looped/explored more (higher cache-read = more turns), so arm 0 cost ~30% more than the skill arms (18.25 vs 13.84–14.48) while scoring *lower* (53% vs 65–70% raw). The skill arms are cheaper AND directionally higher — but the fail-to-pass lift is not statistically significant at n=15 (shipped-vs-no-skill p=0.124). See `report.md` / the continuation plan for the significance analysis.

Reproduce: token aggregation walks `agent-*.jsonl` in the workflow transcript dir, sums `message.usage.{input_tokens,cache_creation_input_tokens,cache_read_input_tokens,output_tokens}` per arm (arm parsed from the `abh/<id>__<arm>__r<run>` path in each transcript), then applies the per-type rates above.
