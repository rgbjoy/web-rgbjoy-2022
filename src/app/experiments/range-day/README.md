# Range Day

A chill driving range with a PGA 2K-style swing stick. Drag anywhere off the
ball (or use the arrow keys) to aim and look around. Press on the ball, pull
down for the backswing and push up to swing through. Backswing depth sets power; the lean of the forward stroke
starts the ball off line and curves it (right fades, left draws). Where you let
go sets the strike (`strikeFactor`): back at the start dot is pure. Stop short
and you keep only the share of the forward swing you made, so a quick jab just
dribbles it ("Chunked it"). Push past and you thin it, up to 25% longer than
you pulled for ("Thinned it"); shoving 40px past fires the swing. The stroke
is traced on the meter, blue going back and red coming through.
Wind changes every shot; flags sit every 50 yards out to 250.

Built from the old Frog Ace experiment: the wind model, sun and shadow setup
carry over, with the pond replaced by a fairway.

## Files

- `SwingMeter.tsx` — the swing pad and traced meter; it drives the scene
  through the `SwingApi` the scene exposes.
- `page.tsx` — HUD, intro, menu and aim keys. Longest drive and the instructions toggle
  persist in `localStorage`.
- `RangeScene.tsx` — the game loop: aim, flight, roll-out, chase camera,
  lighting and flags. Wind streaks are parked for now; the flags and the HUD
  arrow show the wind.
- `game.ts` — dependency-light shot maths: swing power and path, carry, wind, flight and roll
  curves, and scoring against the nearest flag.
- `Fairway.tsx` — the striped, carpet-grained fairway and the greens.
- `Trees.tsx` — tiered low-poly pines around the range, two instanced draws
  (foliage and trunks) with a shade of green per tree.
- `GolfBall.tsx` — loads the golf ball from golf is weird
  (`public/models/golf-ball`, Sketchfab Standard License, see `license.txt`).
- `YardageSign.tsx` — the extruded yardage number over each flag. It turns
  to face the camera and shrinks away when the chase camera flies past.
  `yardage-font.json` holds only the digits of the site's Geist Mono Bold
  (SIL OFL 1.1) in three's typeface format, so no font is fetched at runtime.

## Ground

`Fairway.tsx` is one plane with a small canvas texture repeated across it:
a light and a dark mowing lane, each speckled with fine grain so it reads
like carpet up close and clean stripes far away. Each flag gets a lighter
green disc. Grass blades are parked for now.

## Scale

One world unit is two yards (`YARDS_PER_UNIT`). Carry runs 16–270 yards. Wind
drift grows with carry, so a full drive in a mid wind moves about 15 yards.
After landing the ball takes a few shrinking hops (`rollForShot`). Low, soft
shots skip more and roll further; high ones bounce big, die quickly and stop
sooner. A little randomness varies the height, the roll and a kick off line.
