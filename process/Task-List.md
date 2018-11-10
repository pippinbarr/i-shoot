# Twine prototype

- ~~Write skeleton scenes about three spaces deep in either direction from CT spawn~~
- ~~Write skeleton CT bodies into deepest space (maybe Bombsite B? We'll see.) (Consider making this dynamic in future iteration.)~~
- ~~Hard-code skeleton terrorist encounter into a space, maybe complete with random numbers for missing and dying, hitting and winning~~ (Currently just with a deterministic kill of the terrorist.)
- ~~Add descriptive expansions to two corpses (T and CT)~~ (Currently just the terrorist corpse)
- ~~Language pass to figure out agency and "I statements" etc.~~ (Think this is mostly in place, writing the thing helped a lot here.)
- ~~Language pass to get some feeling into it?~~ (Not sure this is wise?)
- ~~Another writing pass based on current understanding of the game~~
- ~~Do a performance to get a sense of what the feeling of play might actually be~~

- ~~Rewrite scenes based on minimising text, minimising link length (in conversation with testbed work below in terms of the link texts).~~ (Didn't do this - honestly I think I miiiight be done with the Twine prototyping now? Need to start working out my own UI.)

# annyang prototype

- ~~Build a basic project structure with annyang included (and working)~~
- ~~Simulate a sequence of voice commands with text responses on screen (in an array or whatever)~~
- ~~Test it out and write about it~~
- ~~Polish the prototype with some nicer looking typography~~
- ~~Try adding some "what I heard" feedback (at least when it's wrong)~~ (This is going to be really hard since the annyang wildcarding thing seems to override more specific commands.)
- ~~Complete the scene properly with the dead terrorist in the final scene (just fake it)~~

# annyang command testbed

- ~~Build a simple prototype that lets me (and others) try out a whole bunch of relevant commands~~
- ~~Try it out~~
- ~~Reflect on it~~
- ~~Send it to J+M and Rilla~~
- ~~Reflect on tester feedback~~
- ~~Build ability to trace out failed attempts~~

- ~~Turn it into a more thorough testbed where it progressively asks you to try a command three times then turns it into a link after the third fail (stores the interpreted phrases), gives visual feedback when it hears you say something that doesn't work~~
- ~~Get it to print out a diagnostic page at the end with stats, failed phrases, etc.~~
- ~~Rewrite a series of relevant phrases (related to the world and game) that avoids suspected problem phonemes and words~~ (I did do that.)
- ~~Send it to J+M again~~

# Full Twine prototype

- ~~Establish distinct spaces~~
- ~~Put together a Twine with a passage for every distinct space in the game~~
- ~~Take reference images of every location and terrorists (dead and alive) and CTs~~
- ~~Write basic text and linking for every space~~
- ~~Write sample terrorist encounter with kill sequences that allow testing multiple encounters~~
- ~~Implement persistent corpses~~
- Implement characteristic walls/shapes for terrorist encounters
- Different typography for terrorist texts?
- Use a single variable to track terrorists killed and use that to denote game over
- __DOESN'T SEEM TO BE A THING?__ ~~Find a one-page Twine theme?~~

# Vertical slice UI prototype

- Start with annyang prototype and start figuring out nicer UI stuff
- Add "failed" indicator
- Three fails turns the "say it" options into links instead (with a pop up?)
- Consider pausing/starting annyang between passages as a way to conceivably avoid the shutdowns it does sometimes when it gets confuse? (Can you unconfuse it?)
- Improve the transition on a successful phrase
- Improve the overall typography, margins, colours
- Recording the voice input and allowing them to download it? (Would be an amazing sound file... don't know about the storage issues.)

# Game design

- Attempt a more formal writing of the system's dynamics (e.g. terrorist spawning, movement, stealth, cover, etc.)

# Implementation

- Create every area and allow transitions between them (no descriptions for now)
