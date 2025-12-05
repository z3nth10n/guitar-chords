* Validate all existing development. Ensure chords are well calibrated in detection and properly drawn.
* Migrate to an Android APK

chord-library

* [Ok] Add a play button to reproduce sound inside the chord-library (also, the sound should be a guitar sample)
* [Ok] Allow saving those custom chords
* [Ok] Allow setting the tuning for each string individually, and also loading and saving established tunings (Standard E, Drop B, etc.) or custom tunings
* [Ok] Allow moving the buttons inside the canvas to create custom chords

chord-analysis

* [Ok] Adjustment to increase the microphone input volume, giving more gain to the incoming signal

New tools:

* A tool to tune the guitar using different tunings
* A separate tool for a metronome, and then for each current screen (chord-analysis and chord-library, although the latter should be when drawing the 3D tablature) display the metronome at the top-left to play it at X bpm
* A tool that, given a complete tablature, can render it and also tell me which chord it is whenever one appears.

* Create a tool that, given a txt file with tablature format, can display an interface with the running tablature, and using note/chord detection can mark it as correct or incorrect
* A tool to interpret a txt file with an established tablature format
* Ability to export a tablature from Songsterr
* Create a tablature editor like Songsterr and be able to reproduce anything (although bass, drums, etc. would need to be added)
* Create a chord and picking editor to build personalized exercises for guitar practice
* Create a chord and picking player, so that once the editor is used, we can view on screen either a tablature version or the tablature in 3D view, indicating whether what I'm playing is correct or not. With rhythm (selectable speed) or at your own pace
* Allow saving and loading txt files with picking patterns or chords