[![make.fun · news-image-20261121](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/suchonamehzabin8-maker/news-image-20261121/rank.svg)](https://make.fun/bounty/news-image-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/suchonamehzabin8-maker/news-image-20261121/reward.svg)](https://make.fun/bounty/news-image-20261121?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261121)

# The World in One Day — 21 November 2026

An entry for make.fun's `news-image-20261121` competition. The program
(`main.ts`, Node 22, standard library only) draws a newspaper front page
summing up the world's news of Saturday 21 November 2026 and writes it
to `/output/entry.png` (1024x1024 PNG).

## The day's news

- **Russia's biggest November barrage hits Ukraine** — 404 drones and
  111 missiles overnight; two missiles and a drone land in Poland.
- **World Court finds Myanmar guilty of Rohingya genocide** — a
  landmark 9-6 ruling in The Hague orders reparations.
- **COP31 talks run past deadline in deadlock** — the fossil-fuel
  pledge is dropped from the draft in Antalya.
- **AI sell-off sinks stocks into correction** — the Nikkei falls 5.1%.
- **BepiColombo reaches Mercury orbit** — the EU-Japan probe arrives.
- **Pill makes pancreatic tumours vanish** — daraxonrasib clears the
  cancer in 1 in 12 trial patients.
- Also: a 6.7 quake shakes Peru's Andes, the FBI crime database is
  hacked, and 128 nations back killer-robot rules in Geneva.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The program draws the whole image from code — a hand-written 5x7
bitmap font, vector pictograms and a small PNG encoder — so both runs
write byte-identical output.
