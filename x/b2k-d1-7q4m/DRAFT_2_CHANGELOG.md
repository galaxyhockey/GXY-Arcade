# DRAFT_2_CHANGELOG — Back in the 2000s: The Game (private author build)

Draft 2 adds M06–M09 and S02–S07 on top of Draft 1.75. Nothing from M01–M05 or S01 was removed.
This file lists every place the game departs from, re-orders, or fills in the source material, so the author can approve or change each one.
Book text is used word for word (spelling as printed). Side missions are GAME ORIGINAL, as the Draft 2 Bible says.

## Adaptation decisions in the main missions (book canon)

| # | Mission | What the game does | Why | Author action |
|---|---|---|---|---|
| 1 | all | No weekday is shown on the HUD. Chapters are dated the way the book dates them (OCTOBER 1ST 2003, etc.). | Standing rule: the weekday labels do not match 2003. | none unless you want weekdays |
| 2 | M06 | At lunch, "movie night" and "King of the Hill" can be raised in either order. Every line is still spoken once. | The Bible asks for a topic choice. | approve or make it linear |
| 3 | M06 | The drive to work and the drive home after the shift are cuts, not playable drives. The drive home from school is playable. | Pacing. The 4-hour shift is shown as three tasks with a shift clock. | approve |
| 4 | M06 | Sam's screen name is shown as `CaptainSammi06` everywhere. | The book later prints `CaptianSammi06` and `CaptianSammi08`. | pick one spelling |
| 5 | M07 | Scene order follows the BOOK: park walk → Friday → yesterday's messages → bowling at 8:30 PM → the project. | The Bible lists bowling before Friday; the book puts the messages first. | say if you want the Bible order |
| 6 | M07 | "Fair." is spoken by Zeke. | The book prints `"Fair." i said` directly after Chris's own line. | confirm who says it |
| 7 | M07 | The project puzzle (Publisher / Excel / PowerPoint screens) is GAME ORIGINAL. It cannot be failed and never changes the ending: Sam's USB drive is the one turned in. | Bible rule. | approve the puzzle content |
| 8 | M08 | Chesterfield, Lambert and San Antonio are small sets reached by a card. Milo drives; the player rides. | Bible: not one continuous map. | approve |
| 9 | M08 | The ticket counter and security are scripted exactly as written. There is nothing to sneak past. | Bible rule. | approve |
| 10 | M08 | Zeke's jump into the river is a cutscene. | Bible rule. | approve |
| 11 | M08 | The phone screen shows `10 / 06 / 2003` and `Columbus Day: 10 / 13 / 2003` (no weekday). The narration line with "Monday" is the book's own text. | Rule 1. | approve |
| 12 | M09 | The November 1987 passage is narrated in the first person ("me and Eric"), so those lines are spoken by "Jacob (2003)". | Book wording. | confirm the narrator |
| 13 | M09 | The radio beat is narration only. No song plays. | No licensed music in the build. | none |
| 14 | M09 | Debra's order is re-bagged until the bread is on top. | The book says the bread was not squished. | approve |
| 15 | M09 | Chris tackles the innocent customer; the real thief leaves during the scene. Nothing is scored. | Book canon. | none |

## Side missions (GAME ORIGINAL)

Quoted lines are the Bible's lines. Where the Bible describes a beat but gives no line, the game uses a one-line stand-in. Please replace these:

| Mission | Stand-in text now in the game |
|---|---|
| S02 ending | "I asked what the job paid. Mom called it family work." |
| S03 time's up | "The screen goes dark. Dad needs the phone line." |
| S04 ending | Andrew: "How many did you get through?" / Chris: (inflated number) / Mia: "It was (real number)." |
| S05 losing | A results banner and "Go again / Call it a day". |
| S06 ending | "Milo read out the final scores like a tax return. Jax took it personally. I asked if we could all just go eat." |
| S07 opening | "The landline crackled. The repair company was delayed. Again." |
| S07 ending | "Dad said thanks. Barely. Even my grounding has side quests." |

Also GAME ORIGINAL: the encyclopedia passages in S03, the recovery / printer screens in S02, and the wrong-answer messages in both.

## Availability (from the Bible's time-lock grid)

- S02 Computer Troubles: after M05, until M08. Family computer by the front door.
- S06 Pickup Game: after M05, until M08. Elmwood Park court. First to 11 against Jax, then Milo. Passes win or lose.
- S03 Midnight Research: after M06, until M07 starts. 10:00 timer (15:00 option). Gives notes only, plus one hint in M07.
- S07 Phone Troubles: after M08. Optional; nothing later depends on it.
- S04 Pickup Shift and S05 The Longest Train: after M09, at Schnucks. Replayable for a best score.
- The next main mission is always offered even if a side mission is unfinished.

## Grounding (after M08)

- Flags set: GROUNDING_ACTIVE, RESTRICTED_TRAVEL, NIGHTLY_CALL_REQUIRED.
- In free roam, friends are no longer at their hangout spots and making plans by phone is refused with "Dad would kill me if I left...".
- The car still works (school, home, work). There is no wanted level or chase.
- NOT built yet: an actual nightly check-in call, and an end to the grounding. Both wait for the next chapters.

## Numbers that are proposals, not canon

- S04 shift length: 8 real minutes for the four hours. No cash reward.
- S05: Madison's train is 12 carts; the most you can build is 20; long trains are slower and lose carts on sharp turns. No cash reward.
- M06 bagging: three orders. M08 arcade: 8 hoop shots, air hockey to 3. M09 paper towels: 8 throws with a very small target.

## Draft 2.6 — realism pass, part 1 (driving + Chris's house)

**Driving.** The car is tuned as a 1996 Ford Taurus. It has weight: about 12.7 s from 0 to 60 mph, about 31 m to stop from 54 mph, an 11 m U-turn at parking speed. Steering turns gradually and is limited by tyre grip, so fast corners run wide with tyre squeal. The body leans in corners and dips under braking. There is an automatic gearbox, engine, tyre and road sound, a closer chase camera, and a hood camera on V. S brakes first and only then reverses; SPACE is the handbrake.

**Chris's house** was rebuilt from the author's floor-plan sketches and photos. It stands on the same spot.
- Outside: cream brick, brown roof, maroon trim, a storey and a half with the upstairs window in the driveway-side gable, front door with oval glass and coach lights, sunroom, covered porch off the kitchen, detached garage with cupola, wood privacy fence, patio, grills, fire pit, big tree, vegetable patch.
- Main floor: living room and sunroom on the street side, kitchen behind, hallway with the stairs and bathroom, parents' bedroom and a second bedroom at the far end.
- Upstairs: Chris's bedroom on the driveway side, bathroom in the middle with the hallway wrapping round it, second bedroom at the other end.
- The driveway and car moved to the sunroom side. Zeke now comes through the kitchen window on that side.
- Modern items in the reference photos were swapped for 2003 ones. The house number is left off.
- Basement (added in Draft 2.7): the big L-shaped room along the street side and the far end, the laundry room with a bathroom and the laundry chute, the small empty room under the stairs, and the desk corner with white panelling, gray carpet, the tube TV and the push-button phone. The furniture other than the desk corner is game dressing. No story scene uses the basement yet.
- Furniture inside each room keeps its old arrangement so the story scenes still line up; it has not been matched to the photos piece by piece.

Still to do in this pass: the town rebuilt on real street shapes, hills and street detail, pedestrians and traffic lights.

## Draft 2.7 — the town on real street shapes

The grid town from the last build is gone. The map is now laid out from real street data for Belleville and Swansea.

**What moved, and why.** On the old map Chris's house and Schnucks were on opposite sides of N Illinois Street and the high school was next door. In the real town home and Schnucks are both west of Illinois, and Belleville West is a long drive to the south-west.
- The Schnucks plaza (with the gas station) was turned around and now sits on the west side of Illinois. From home: up Oakmont, right on Maple, left on Illinois, store on the left. That is the shape of the real drive.
- Belleville West was moved out to the south-west, on a stretch of Frank Scott Parkway West.
- Chris's street, Maple Street, Jax's house and Elmwood Park did not move.
- Every story scene at Schnucks and at the school was re-pointed to the new positions.

**Streets.** About 55 real streets, drawn with their real curves: N and S Illinois, N Belt West and East, W and E Main, Frank Scott Parkway, IL-15, IL-161, Old St. Louis Road, Lebanon Avenue, Centreville Avenue, S Belt West and a set of neighbourhood streets. Richland Creek and the MetroLink line are drawn too. Street data is from OpenStreetMap (c) OpenStreetMap contributors, ODbL.
- Scale is about 1 game unit to 5.5 metres. Streets closer together than a block or two were thinned out, because game roads cannot shrink with the map.
- Street names: major public roads keep their real names. The real street Chris's house stands on is shown as Oakmont Drive, and the cross street at his corner is not drawn.
- The compass changed: north is now toward Schnucks. The big map (M) is drawn north-up.

**Landmarks** are placed as near their real spots as the streets allow: the Public Square and fountain where Main meets Illinois, downtown storefronts, St. Clair County Building, City Hall, the library, Cathedral of St. Peter, Lincoln Theatre, News-Democrat, Melvin Price Memorial Park, Skyview Drive-In, Eckert's, Wolf Branch School, Swansea Village Hall and Fire Dept., Memorial Hospital, two MetroLink platforms, Swansea and Belleville water towers, and the roadside businesses along Illinois (Moto Mart, Steak 'n Shake, White Castle, Imo's, Hardee's, Dairy Queen, Belleville Pancake House, Walgreens, a bank).
- Not placed (no clear land found yet): Belle-Clair Fairgrounds, Walnut Hill Cemetery, Schranz Memorial Park.
- Marquee text that is not from the book is unchanged from before (Lincoln Theatre, Skyview).

**Drive times** (estimated from distance, not hand-timed): home to Schnucks is roughly 45 seconds; home to Belleville West is roughly a minute and a half to two minutes. The real ratio is about 1 to 3; the game's is nearer 1 to 2.

**Not done:** traffic lights, pedestrians outside the story streets, interiors for any new building.

## Draft 2.8 — hills, road fixes, house fixes (after the author's first drive)

- **Hills.** The ground now rolls, up to about 10 game units high, with a shallow valley along the creek. Roads rise and dip with it, houses sit on the slopes, traffic follows the ground, and the car tilts on a hill, slows climbing and picks up speed going down. The story neighbourhood, the Schnucks plaza, the school and every landmark stand on level ground, so no story scene changed height.
- **Roads.** Every place two streets cross or meet now has a plain patch of asphalt, so centre lines and sidewalks no longer run through each other. Real streets that were cut off at the edge of the story neighbourhood are joined to the nearest story street where there is a clear path, or finished with a turning circle.
- **Creek and rail.** Nothing is built on the creek or the MetroLink line any more (a house was sitting in the creek).
- **Chris's house.** A dormer was added on the back of the roof over the stairs and the upstairs hallway, which used to be so low that Chris's head went through the roof. The landing at the top of the stairs is deeper.
- Changes of level are game-original; the real ground was not surveyed.

## Draft 2.9 — traffic lights, stop signs, pedestrians

- **Junction rules.** Every place streets cross or meet is worked out automatically. Two big roads get traffic lights (17 junctions); elsewhere the smaller street gets stop signs, or all sides stop if the streets are equals (25 junctions). The Public Square stays a roundabout. In the story neighbourhood: Maple at Illinois and Westhaven at Illinois have lights; Oakmont at Maple and Oakmont at Westhaven are all-way stops.
- **Lights.** Each signal cycles: main road green 14 s, yellow 3 s, all red 1.5 s, then the cross street.
- **Traffic obeys.** Cars stop on red, stop at stop signs and take turns, keep a gap to the car in front, and wait for people who are crossing.
- **Pedestrians.** 32 people walk the sidewalks near home, the plaza, downtown and the school. They cross with the green light, or when the road is clear at a stop sign.
- **Story characters obey too.** Any story car driven by the script (Milo's car, for example) stops for red lights and stop signs. A story character walking a scripted path waits at the kerb on a red light. Running or chasing characters, and characters following Chris, are left alone so chases still work.
- **Chris is not forced.** The player can still run a light; nothing happens yet if he does.
- Known gaps: cars do not turn at junctions (each stays on its own street), there are no walk / don't-walk lamps, and a car that re-enters at the edge of the map can roll through a light there.

### Hills, second pass (the first pass made a mess of roads and places)

The first version laid roads and buildings over the hills. Now the ground is shaped to them instead:
- Every street is cut level from side to side and follows a smooth rise and fall along its length. The ground eases back to the natural hill over about 13 units either side.
- Every house, shop, landmark and field stands on a level pad at the height of the street it faces, so driveways and parking lots meet the road.
- Junctions are level, with their asphalt patch above the road surface.
- The hills themselves are a little gentler, and the terrain is drawn on a finer grid.

## Draft 2.10 — the car radio, first station (GAME ORIGINAL feature)

- New `radio.js`. In the car: **R** = radio on/off (first press picks the music). Songs cannot be skipped, like a real station. First station: **Z107.7** (44 songs, shuffled; you tune in part-way through the first one). The song name shows as a toast.
- The songs are NOT in the game's files or the repository. They are read from a folder on the player's own computer (remembered by the browser; on phones, Firefox and Safari you pick the song files once and the browser keeps its own copy), or from a git-ignored `radio/z1077/` folder when running a local copy.
- While the radio plays, the old generated car tune is silent; with the radio off (or no folder) it plays as before. Radio follows the Music volume setting and pauses with the game.
- Not built yet: the other two stations, a station dial on the HUD.
- Streaming from any device: `radio/encrypt.js` (local only) locks each song with a passcode (AES-256-GCM) into `radiox/`; the game asks for the passcode once per device (R in the car), then downloads and unlocks one song at a time. Without the passcode the files are unreadable.

## Draft 2.11 — ground fixes, walk-in shops, tickets (all GAME ORIGINAL systems)

- **Hills no longer poke through roads and lots.** After everything is placed, the ground is graded to what lies on it: cut down where a hill rose through a road, car park, lawn or path, filled where one hung in the air. Junction patches now follow the slope instead of being rigid discs. Walking and driving use exactly the drawn ground. Measured: 609 poke-through spots before, 0 after (outside Chris's basement, which is meant to be below ground).
- **Walk-in interiors** for the nine roadside businesses: Walgreens and Moto Mart (shelves, coolers, counter), Steak 'n Shake, White Castle, Imo's, Hardee's, Dairy Queen, Pancake House (counter, menu board, booths, tables), First National Bank (teller line, desks, vault). Each has a clerk and a counter you can use in free roam: buy items / order food (GAME ORIGINAL lines and 2003-ish prices), and a savings account at the bank (deposit / withdraw).
- **Tickets and repair bills, free roam only** (story missions stay as written): running a red light $30, rolling a stop sign $15 (you must come to a stop within about 20 m of the sign), crashing at speed $20–$60 body shop bill (at most one per 10 s). Money comes out of Chris's cash; if he is short the balance goes negative ("you owe Dad") until pay covers it.
- **Curfew:** Chris can no longer be grounded two days in a row for curfew. Dad has a GAME ORIGINAL line for it.
- **Fixed:** the ringing house phone (Eric's call) could not be answered, because the everyday "USE THE PHONE" prompt sat on the same spot and took the key press. It now steps aside while the phone rings.
- Not done: the larger landmarks (hospital, Wolf Branch school, village hall, Eckert's) are still closed shells; shop windows are not see-through from inside.

## Draft 2.12 — real TV

- The living-room TV plays real 2003-era footage (10-minute clips, 360p), passcode-locked like the radio (same passcode). Channels by game hour: Nickelodeon 6 AM–6 PM (SpongeBob, Fairly OddParents), Jeopardy! noon–7 PM, KTVI Fox 2 News 5–7 PM, Prime Time 7 PM–midnight (King of the Hill, Malcolm in the Middle, Seinfeld), Adult Swim 10 PM–6 AM (Family Guy, South Park, Space Ghost). About 3 in 10 channel changes land on a commercial (2000–2002 ads, including Schnucks).
- Footage comes from the author's own files; `radio/locktv.js` (local only) builds `tvx/` from the git-ignored `tv/` folder. Without the passcode the old text channels are used.
