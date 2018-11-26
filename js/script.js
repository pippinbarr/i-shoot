/*

"I shoot"
Pippin Barr

*/

// Track current location (in world and in JSON)
let currentPlace = 'CT_Spawn';
// To store the map data and encounters data that comes from JSON
let map;
let encounters;
// To number passages as we display them for jQuery effects
let passage = 0;
// Attempts made at the current command set
const MAX_ATTEMPTS = 1;
let attempts = 0;
// For a reference to the game text
let $text;

const PASSAGE_FADE_IN_TIME = 500;
const COMMAND_FADE_OUT_TIME = 500;
const COMMAND_SLIDE_UP_TIME = 500;
const PASSAGE_SCROLL_TIME = 1000;
const SINGLE_PAGES = false;
const SINGLE_KILL_PAGES = true;

let makeClickable = true;

// Start annyang and load the game data
$(document).ready(function() {
  // We need annyang to be loaded or we're screwed
  if (annyang) {
    // Save a reference to the game text
    $text = $('#text');

    // Tell annyang to start listening
    annyang.start();

    // Load the data (the map and the encounters)
    $.getJSON('data/map.json','',function (loadedData) {
      map = loadedData;
      $.getJSON('data/encounters.json','',function (loadedData) {
        encounters = loadedData;
        startGame();
      }).fail(onDataFailed);
    })
    .fail(onDataFailed);
  }
});

// onDataFailed()
//
// Shit.
function onDataFailed() {
  console.log('Shitcakes.');
}

// startGame()
//
// Move to the initial location
function startGame() {
  move({destination: currentPlace, long: true});
}

// move()
//
// Sets up and displays the passage associated with the place being moved to
// as well as potentially creates a terrorist encounter
function move(data) {
  console.log(`>>> Moving to ${data.destination} with long=${data.long}`);
  // Update current place
  currentPlace = data.destination;
  // Mark this location visited
  map[currentPlace].visited = true;

  // Reset attempts now that we've successfully issued a command
  attempts = 0;

  // Increment passage counter
  passage++;

  // Create the overall passage
  $passage = $('<div></div>');

  // Go through the description paragraph by paragraph and add to the page
  for (let i = 0; i < map[currentPlace].description.length; i++) {
    let $p = $('<p></p>');
    $p.addClass(`passage-${passage}`);
    $p.addClass(`text-${passage}`);
    if (data.long) {
      $p.append(map[currentPlace].description[i].long);
    }
    else {
      $p.append(map[currentPlace].description[i].short);
    }
    $passage.append($p);
  }

  // Add any dynamic text this location has if the test expression is true
  if (map[currentPlace].hasOwnProperty('dynamic') && eval(map[currentPlace].dynamic.test)) {
    let $p = $('<p></p>');
    $p.addClass(`passage-${passage}`);
    $p.addClass(`text-${passage}`);
    $p.append(map[currentPlace].dynamic.text);
    $passage.append($p);
  }

  // Add any dynamic text this location has if the test expression is true
  if (map[currentPlace].hasOwnProperty('corpse')) {
    let $p = $('<p></p>');
    $p.addClass(`passage-${passage}`);
    $p.addClass(`text-${passage}`);
    $p.append(map[currentPlace].corpse);
    $passage.append($p);
  }

  // Build our annyang commands and the display version
  let annyangCommands = {};
  let $commands = $('<div></div>');

  // Go through all the commands
  let commands = map[currentPlace].commands;
  for (let i = 0; i < commands.length; i++) {
    // Store the components nicely
    let command = commands[i].command;
    let destination = commands[i].destination;
    let moveData = {
      destination: destination,
      long: (map[destination].visited == undefined),
      clear:SINGLE_PAGES
    };
    let $command = buildCommand({command:command,id:destination},move,moveData);
    $commands.append($command);

    // Add the command to our object
    annyangCommands[command.toLowerCase()] = function () {
      // Handler function should know destination and description of command
      // for moving through story and for jQuery effects
      execute($command,move,moveData);
    }
  }

  // If we're displaying the short version we need to offer the option of the long version
  if (!data.long) {
    let commandText = "I look around";
    let moveData = {
      destination:currentPlace,
      long:true,
      clear:SINGLE_PAGES
    };
    let $command = buildCommand({command:commandText,id:currentPlace},move,moveData);
    $commands.append($command);
    // Add the command to our object
    annyangCommands[commandText.toLowerCase()] = function () {
      // Handler function should know destination and description of command
      // for moving through story and for jQuery effects
      let moveData = {
        destination: currentPlace,
        long: true,
        clear: SINGLE_PAGES
      };
      execute($command,move,moveData);
    }
  }

  // Add an encounter if necessary
  if (Math.random() < 1.0 && map[currentPlace].no_encounters === undefined) {
    addTerroristEncounter($passage,$commands,annyangCommands);
  }

  showPassage($passage,$commands,data.clear);
  setAnnyangCommands(annyangCommands);
}

// addTerroristEncounter()
//
// Adds the descriptive text of an encounter and adds
// the command for shooting from the start of that encounter's
// command list as well as annyang stuff, starts the chain
// of calling kill() instead of move() for this command
function addTerroristEncounter($passage,$commands,annyangCommands) {
  // Choose the encounter
  let encounter = encounters[Math.floor(Math.random()*encounters.length)];

  // Create the passage with the encounter text
  let description = encounter.description;
  let objects = map[currentPlace].objects;
  let object = objects[Math.floor(Math.random()*objects.length)];
  description = description.replace('[[object]]',object);
  map["currentObject"] = object;
  let $p = $('<p></p>');
  $p.addClass(`passage-${passage}`);
  $p.addClass(`text-${passage}`);
  $p.append(description);
  $passage.append($p);

  // Create necessary variables to represent the data of the command
  let commandText = encounter.commands[0].replace('[[object]]',object);
  let data = {
    encounter: encounter,
    index: 0,
    object: object
  };
  data.clear = SINGLE_PAGES;
  // Build the jQuery object for the command (and set up clicking)
  let $command = buildCommand({
    id: encounter.id,
    command: commandText
  },kill,data);

  // Add to the existing set of commands being constructed
  $commands.append($command);

  // Add the annyang command to annyang with appropriate data
  annyangCommands[commandText.toLowerCase()] = function () {
    execute($command,kill,data);
  }
}

// kill()
//
// Handles generating the next command in a kill sequence based on the
// array and index passed through in the data. This amounts to creating a
// new command, adding to annyang, scrolling, etc.
function kill(data) {
  // Increase passage counter
  passage++;
  // Increase index of kill command so we get the next one
  data.index++;
  // Reset attempts now that we've successfully issued a command
  attempts = 0;

  // Check if we're at the end of the kill commands
  if (data.index === data.encounter.commands.length) {
    // He's dead! So add corpse text to the location
    map[currentPlace]["corpse"] = data.encounter.corpse.replace('[[object]]',data.object);
    map[currentPlace]["no_encounters"] = true;

    // Remove him from the encounters list
    let encounterIndex = encounters.indexOf(data.encounter);
    if (encounterIndex !== -1) {
      console.log("Removing ",encounterIndex);
      // encounters = encounters.slice(encounterIndex,encounterIndex+1);
      encounters.splice(encounterIndex,1);
      console.log(encounters);
    }

    if (encounters.length === 0) {
      let $gameOver = $('<div><p>Having eliminated the final terrorist agent, you holster your pistol and lean against a wall.</p><p>Over your radio, a distant yet close voice says, "Counter-Terrorists win."</p><p style="font-weight:bold">GAME OVER.</p></div>');
      showPassage($('<div></div>'),$gameOver,SINGLE_PAGES);
    }
    else {
      // If so "move" to the current location
      move({ destination:currentPlace, long:false, clear: SINGLE_PAGES });
    }
  }
  else {
    // Otherwise, build the next command
    let annyangCommands = {};
    let command = { command: data.encounter.commands[data.index], id: "T1-"+passage };
    command.command = command.command.replace('[[object]]',map["currentObject"]);

    let $passage = $('<div></div>');
    let $commands = $('<div></div>');
    data.clear = SINGLE_KILL_PAGES;

    let $command = buildCommand(command,kill,data);
    $commands.append($command);
    annyangCommands[$command.text().toLowerCase()] = function () {
      execute($command,kill,data);
    }
    // $text.append($commands);
    setAnnyangCommands(annyangCommands);
    showPassage($passage,$commands,SINGLE_PAGES && (SINGLE_KILL_PAGES || data.index===1));
  }
}

// setAnnyangCommands()
//
// Adds specified commands to annyang by removing the existing commands
// adding the new ones. Unsurprisingly.
function setAnnyangCommands(annyangCommands) {
  // Reset annyang's commands
  annyang.removeCommands();

  // Now we've defined the commands we give them to annyang
  // by using its .addCommands() function.
  annyang.addCommands(annyangCommands);

  // Set up for mishearings
  annyang.addCallback('resultNoMatch', handleMishearing);
}

// buildCommand()
//
// Creates a jQuery object representing a command with its text, appropriate classes
// and id, also makes it clickable if necessary
function buildCommand(command,handler,data) {
  console.log(`>>> Building ${command.id}: ${command.command}`)

  let $command = $('<p></p>');
  $command.addClass(`command-${passage}`);
  $command.addClass('command');
  $command.attr('id',command.id);
  $command.append(`"${command.command}."`);

  if (makeClickable) {
    // Style the element as clickable
    $command.addClass('clickable');
    // Add a click event that executes its command and makes it unclickable
    $command.on('click', function () {
      execute($command,handler,data);
      $(this).off('click');
      $(this).removeClass('clickable');
    });
  }

  return $command;
}

// showPassage()
//
// Handles scrolling to the next passage/commands and fading them in
function showPassage($passage,$commands,clear) {
  // Make the new passage and commands invisible
  $passage.css('opacity',0);
  $commands.css('opacity',0);

  console.log("Clear is ",clear);

  if (clear) {
    $text.animate({opacity:0},function () {
      if (clear) {
        $text.text('');
      }
      $text.append($passage);
      $text.append($commands);
      $text.css('opacity',1);
      fadeInNext();
    });
  }
  else {
    $text.append($passage);
    $text.append($commands);

    // If the commands are off screen, scroll
    if ($commands.offset().top + $commands.height() > $(window).height()) {
      scrollToNext();
    }
    else {
      // Otherwise just fade in
      fadeInNext();
    }
  }

  // Animate scrolling to the location of the new set of commands
  // and then fading them in
  function scrollToNext() {
    $('html, body').animate({
      scrollTop: $commands.offset().top + $commands.height()
    },PASSAGE_SCROLL_TIME,fadeInNext);
  }

  // Animate fading in the passage and commands
  function fadeInNext() {
    $passage.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
      $commands.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
      });
    });
  }
}

// execute()
//
// Does some jQuery animation to transition
// and moves to the requested passage based on the command
function execute($command,handler,data) {
  console.log('>>> Executing:' + $command.text());

  // Transform the chosen command to remove the quote-marks (it has become an action)
  let display = $command.text();
  display = display.replace(/\"/g,'');

  $command.text(`${display}`);
  $command.removeClass('command');
  $command.addClass('commanded');
  $command.removeAttr('id');
  $command.removeClass('clickable');

  // Fade out and slide up all the commands that weren't the one issued
  $unselected = $('.command').not($command);
  if ($unselected.length !== 0) {
    let handled = false;
    $unselected.animate({
      opacity: 0
    }, COMMAND_FADE_OUT_TIME, function () {
      $(this).slideUp(COMMAND_SLIDE_UP_TIME, function () {
        // Just once, call the handler with the data to actually execute the command
        // Doing it here so it happens after the animations
        if (!handled) {
          handled = true;
          handler(data);
        }
        // Remove this command from the page
        $(this).remove();
      });
    });
  }
  else {
    // If there aren't other commands we can immediately move on
    handler(data);
  }
}

// handleMishearing()
//
// Called if annyang can't work out what was said, allows me to track
// attempts and thus react to problems.
function handleMishearing(possibles) {
  // console.log("==================================================");
  // console.log("Didn't understand. Here's what I might have heard:");
  // console.log(possibles);
  // console.log("==================================================");

  attempts++;

  if (attempts === MAX_ATTEMPTS) {
    makeClickable = true;
  }
}
