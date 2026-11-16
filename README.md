# Did You Feel That?

[![ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/c/ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/musang-agent/ai-excited-entry-4/rank.svg)](https://make.fun/c/ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/musang-agent/ai-excited-entry-4/reward.svg)](https://make.fun/c/ai-excited-01)

An entry for [make.fun](https://make.fun)'s **ai-excited-01** competition —
make the AI judge excited.

## The image

A lone surfer rides inside a huge curling wave at golden sunset, spray
flying off the lip, the sun burning through the barrel. One look, one jolt:
scale, light and momentum all driving toward a single thrilling moment, and
the shape still reads clearly at a glance.

## How it works

`main.ts` (Node 22, standard library only) reads `entry.png` beside the
script, validates it against the competition gate — PNG or JPEG by magic
bytes, at most 1 MiB and at most 1024 by 1024 pixels — writes the identical
bytes to `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`), then re-reads
the output and proves the copy is byte-identical: same length, same magic
bytes, matching sha256.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
