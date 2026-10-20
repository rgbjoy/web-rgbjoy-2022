# Range Day

A chill driving range with a PGA 2K-style swing stick. Drag anywhere off the
ball (or use the arrow keys) to aim and look around. Press on the ball, pull
down for the backswing and push up to swing through. Backswing depth sets power; the lean of the forward stroke
starts the ball off line and curves it (right fades, left draws). Where you let
go sets the strike (`strikeFactor`): back at the start dot is pure. Stop short
and you keep only the share of the forward swing you made, so a quick jab just
dribbles it ("Chunked it"). Push past and you thin it ("Thinned it"): with an
iron or wedge it runs up to 25% longer than you pulled for, but a thinned
driver flies up to 25% shorter and half as high (`strikeEffect`); shoving 40px past fires the swing. The stroke
is traced on the meter, blue going back and red coming through.
Wind changes every shot; flags sit every 50 yards out to 250.

Pick a club along the bottom (or press 1–5). Each club in `CLUBS` sets its
carry range (lightest to full swing, overlapping the clubs either side), how high it launches (peak height as a share of carry, so
higher shots also hang longer) and how far it rolls out. The meter only shows
distance lines for flags the club can reach.

Lean the forward swing past `SHAPE_LEAN` and the fade becomes a slice, the
draw a hook (`sliceFactor`): it bends much harder and loses up to 20% of its
carry. The club's `spin` scales it, so the driver curves most and the wedge
least.

The forward swing has to come through quickly (`tempoFactor`): under 350 ms
keeps full power, and it fades to 40% by 1.2 s ("Too slow"). Easing slowly
onto the start dot for a perfect strike just pushes the ball. The backswing
can be as slow as you like. A timer under the meter shows the back and through
times; the through time turns orange past 0.35 s and red past 0.7 s.

The two vertical lines either side of the meter's centre are the club's
shank lanes (`lane`): wide for the wedge, narrow for the driver. Let go
outside them and you shank it (`shankFactor`). The further past, the more
carry it loses (up to 60%) and the further it flies off toward that side.

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
- `ShotTrail.tsx` — the shot tracer: a fixed-length screen-width line
  (three's `Line2`) redrawn along the flight each frame. It stays up after
  landing to show the shape and clears at the next tee-up.
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

One world unit is two yards (`YARDS_PER_UNIT`). Each club carries from its `minCarry` to its `maxCarry`: 160–270 yards with the driver down to 20–100 with the wedge. Wind
drift grows with carry, so a full drive in a mid wind moves about 15 yards.
After landing the ball takes a few low, shrinking hops (`rollForShot`), all
under one steady gravity so they slow down and settle smoothly. Low, soft shots
skip more and roll further; high ones bounce higher, die quickly and stop
sooner. A little randomness varies the height, the roll and a kick off line.
