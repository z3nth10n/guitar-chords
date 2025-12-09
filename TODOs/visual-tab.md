* Host the API on a free hosting service
* Be able to access it from my GitHub Pages
* Add a search engine (https://github.com/Metaphysics0/songsterr-downloader/blob/main/src/lib/server/services/songsterr.service.ts)
* Make searched songs get added to localStorage and appear again
* Make the tablatures I'm currently rendering work with the new features

* Fix visual issues on mobile

* It should also set the note color according to the finger that should play it (the program must infer this using the one-finger-per-fret rule)
* It should also accept manual corrections using a finger-position tablature if available (below the fret tablature)
* For this, the txt file should include another tablature with the numbers 1, 2, 3, 4 to indicate the finger according to the note (fret) and string

* Draw the duration of each picking/chord according to what the txt specifies
* Spacing between notes/chords should match the timing of the figure within the measure
* Allow selecting the playing tempo or setting a custom tempo (in a box in a corner, with a slider)
* The bouncing ball that moves along as the measure progresses
* The tablature should scroll as the song plays
* If the tablature is very long, load it in chunks (10 measures at a time)
* Good chord and note detection via microphone
* Good chord detection from the tablature

Within visual-tab, work on various drawing modes:

* Tablature like Songsterr
* 2D tablature but colorful based on fingers
* Color-coded by string
* 3D perspective like Yousician
* Perspective like Rocksmith

Color themes based on fingers or strings could be defined in a settings panel

Additionally, chords will have their own fixed colors. But it should be possible to enable or disable whether they show as blocks or as individual fret numbers.