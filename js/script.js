/*

"I shoot"
Pippin Barr

*/

// Track current location (in world and in JSON)
let currentPlace = 'Introduction';
// To store the map data and encounters data that comes from JSON
let map;
let encounters;
let currentEncounter;
let currentObject;
// To number passages as we display them for jQuery effects
let passage = -1;
// Attempts made at the current command set
const MAX_ATTEMPTS = 3;
let attempts = 0;
let annyangCommands;
let annyangError = false;
let textRecognitionStarted = false;
// For a reference to the game text
let $text;

const PASSAGE_FADE_IN_TIME = 500;
const COMMAND_FADE_OUT_TIME = 250;
const COMMAND_SLIDE_UP_TIME = 250;
const SCROLL_PER_PIXEL = 3;
const SINGLE_PAGES = false;
const SINGLE_KILL_PAGES = true;
const MIN_LAST_SEEN = 3;
const BASE_ENCOUNTER_PROBABILITY = 0.2;

let encounterProbability = BASE_ENCOUNTER_PROBABILITY;
let stepsSinceEncounter = 0;

// Start annyang and load the game data
$(document).ready(function() {
  // Save a reference to the game text
  $text = $('#text');

  // We need annyang to be loaded or we're screwed
  if (annyang) {

    createMishearingDialog();

    // Set up for mishearings
    annyang.addCallback('resultNoMatch', handleMishearing);
    annyang.addCallback('resultMatch', handleHearing);
    annyang.addCallback('errorPermissionDenied', handlePermissionDenied);
    annyang.addCallback('errorPermissionBlocked', handlePermissionBlocked);
    annyang.addCallback('start', function() {
      textRecognitionStarted = true;
    });

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
  else {
    handlePermissionDenied();
  }
});

function createMishearingDialog() {
  // Create the mishearing dialog
  $dialog = $('<div></div>');
  $dialog.attr('title',"Problem");
  $dialogText = $('<p></p>');
  $dialogText.append("It seems like the speech recognizer isn't hearing you very well. Do you want to enable clickable links for this single action?");
  $dialog.append($dialogText);
  $dialog.dialog({
    autoOpen: false,
    resizable: false,
    height: "auto",
    // width: 400,
    modal: true,
    buttons: {
      "Yes": function() {
        makeCommandsClickable();
        $(this).dialog( "close" );
      },
      "Keep trying": function() {
        $(this).dialog("close");
      }
    },
    close: function () {
      annyang.addCommands(annyangCommands);
      attempts = 0;
    }
  });
}

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
  if (annyangError) return;

  move({destination: currentPlace, long: true, clear: true });
}

// move()
//
// Sets up and displays the passage associated with the place being moved to
// as well as potentially creates a terrorist encounter
function move(data) {
  console.log(`>>> Moving to ${data.destination} with long=${data.long} and clear=${data.clear}`);
  // Update current place
  currentPlace = data.destination;
  // Mark this location visited
  map[currentPlace].visited = true;

  // Reset attempts now that we've successfully issued a command
  attempts = 0;

  // Increment passage counter
  passage++;

  encounterProbability += (stepsSinceEncounter * 0.1);
  // console.log("encounterProbability: " + encounterProbability)


  if (data.resetEncounter) {
    currentEncounter = undefined;
    currentObject = undefined;
    encounters.forEach(function(e) {
      e.last_seen++;
    });
  }

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
    $p.addClass("t-description");
    $p.append(map[currentPlace].corpse);
    $passage.append($p);
  }

  // Build our annyang commands and the display version
  annyangCommands = {};
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
      clear: (SINGLE_PAGES || map[currentPlace].single_page),
      resetEncounter: true
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
      clear:SINGLE_PAGES,
      resetEncounter:false
    };
    let $command = buildCommand({command:commandText,id:currentPlace},move,moveData);
    $commands.append($command);
    // Add the command to our object
    annyangCommands[commandText.toLowerCase()] = function () {
      // Handler function should know destination and description of command
      // for moving through story and for jQuery effects
      execute($command,move,moveData);
    }
  }

  addTerroristEncounter($passage,$commands,annyangCommands);

  console.log("showPassage with " + data.clear);
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

  stepsSinceEncounter++;

  if (currentEncounter === undefined) {
    if (passage < 3) {
      stepsSinceEncounter = 0;
      return;
    }
    if (map[currentPlace].no_encounters !== undefined) return;
    if (Math.random() > encounterProbability) return;

    encounters.sort(function(a,b) {
      return b.last_seen - a.last_seen;
    });
    let elligible = [];
    encounters.forEach(function (e) {
      if (e.last_seen >= MIN_LAST_SEEN) {
        elligible.push(e);
      }
    });
    if (elligible.length === 0) return;
    currentEncounter = elligible[Math.floor(Math.random() * elligible.length)];
    currentEncounter.last_seen = 0;

    let objects = map[currentPlace].objects;
    currentObject = objects[Math.floor(Math.random()*objects.length)];

    stepsSinceEncounter = 0;
    encounterProbability = BASE_ENCOUNTER_PROBABILITY;
  }

  // Create the passage with the encounter text
  let description = currentEncounter.description;
  description = description.replace('[[object]]',currentObject);
  if (currentEncounter.seen === undefined) {
    description = "A " + description;
    currentEncounter.seen = true;
  }
  else {
    description = "The " + description;
  }
  map["currentObject"] = currentObject;
  let $p = $('<p></p>');
  $p.addClass(`passage-${passage}`);
  $p.addClass(`text-${passage}`);
  $p.addClass("t-description");
  $p.append(description);
  $passage.append($p);

  // Create necessary variables to represent the data of the command
  let commandText = currentEncounter.commands[0].replace('[[object]]',currentObject);
  let data = {
    encounter: currentEncounter,
    index: 0,
    object: currentObject
  };
  data.clear = SINGLE_PAGES;
  // Build the jQuery object for the command (and set up clicking)
  let $command = buildCommand({
    id: currentEncounter.id,
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

    // Reset encounter state
    currentEncounter = undefined;
    currentObject = undefined;

    // Remove him from the encounters list
    let encounterIndex = encounters.indexOf(data.encounter);
    if (encounterIndex !== -1) {
      // console.log("Removing ",encounterIndex);
      // encounters = encounters.slice(encounterIndex,encounterIndex+1);
      encounters.splice(encounterIndex,1);
      // console.log(encounters);
    }

    if (encounters.length === 0) {
      let $gameOver = $('<div><p>Having eliminated the final terrorist agent, you holster your pistol and lean against a wall.</p><p>Over your radio, a distant yet close voice says, "Counter-Terrorists win."</p><p style="font-weight:bold">GAME OVER.</p></div>');
      showPassage($('<div></div>'),$gameOver,SINGLE_PAGES);
    }
    else {
      // If so "move" to the current location
      move({ destination:currentPlace, long:false, clear: SINGLE_PAGES, resetEncounter: true });
    }
  }
  else {
    // Otherwise, build the next command
    annyangCommands = {};
    let command = { command: data.encounter.commands[data.index], id: "T1-"+passage };
    command.command = command.command.replace('[[object]]',map["currentObject"]);

    let $passage = $('<div></div>');
    let $commands = $('<div></div>');
    data.clear = SINGLE_KILL_PAGES;

    let $command = buildCommand(command,kill,data);
    $commands.append($command);
    annyangCommands[command.command] = function () {
      execute($command,kill,data);
    }
    // $text.append($commands);
    setAnnyangCommands(annyangCommands);
    showPassage(undefined,$commands,SINGLE_PAGES && (SINGLE_KILL_PAGES || data.index===1));
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
}

// buildCommand()
//
// Creates a jQuery object representing a command with its text, appropriate classes
// and id, also makes it clickable if necessary
function buildCommand(command,handler,data) {
  // console.log(`>>> Building ${command.id}: ${command.command}`)

  let $command = $('<p></p>');
  $command.addClass(`command-${passage}`);
  $command.addClass('command');
  $command.attr('id',command.id);
  $command.append(`"${command.command}."`);

  $command.data('handler',handler);
  $command.data('data',data);

  return $command;
}

// showPassage()
//
// Handles scrolling to the next passage/commands and fading them in
function showPassage($passage,$commands,clear) {

  // Make the new passage and commands invisible
  if ($passage) $passage.css('opacity',0);
  $commands.css('opacity',0);

  if (clear) {
    $text.animate({opacity:0},PASSAGE_FADE_IN_TIME,function () {
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
    let pixels = ($commands.offset().top + $commands.height()) - ($('html').scrollTop() + $(window).height());
    if (pixels > 0) {
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
    let pixels = ($commands.offset().top + $commands.height()) - ($('html').scrollTop() + $(window).height());
    $('html, body').animate({
      scrollTop: $commands.offset().top + $commands.height()
    },SCROLL_PER_PIXEL * pixels,fadeInNext);
  }

  // Animate fading in the passage and commands
  function fadeInNext() {
    if ($passage !== undefined) {
      $passage.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
        $commands.animate({opacity:1},PASSAGE_FADE_IN_TIME);
      });
    }
    else {
      $commands.animate({opacity:1},PASSAGE_FADE_IN_TIME);
    }
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

function makeCommandsClickable() {
  $('.command').each(function () {
    // Style the element as clickable
    $(this).addClass('clickable');
    // Add a click event that executes its command and makes it unclickable
    $(this).on('click', function () {
      execute($(this),$(this).data('handler'),$(this).data('data'));
      $(this).off('click');
      $(this).removeClass('clickable');
    });
  });
}

// handleMishearing()
//
// Called if annyang can't work out what was said, allows me to track
// attempts and thus react to problems.
function handleMishearing(possibles) {
  if ($dialog.dialog('isOpen')) {
    return;
  }
  console.log("==================================================");
  console.log("Didn't understand. Here's what I might have heard:");
  console.log(possibles);
  console.log("Current commands are:");
  console.log(annyangCommands);
  console.log("==================================================");

  attempts++;
  console.log(`${attempts} attempts.`);

  $('.command').effect('shake',{
    direction: 'left',
    distance: 5,
    times: 3
  });

  if (attempts === MAX_ATTEMPTS) {
    annyang.removeCommands();
    $dialog.dialog('open');
    attempts = 0;
  }
}

function handleHearing(heard,command,possibles) {
  console.log("==================================================");
  console.log("Heard: " + heard);
  console.log("Matches: " + command);
  console.log("Could have been:");
  console.log(possibles);
  console.log("==================================================");

  console.log(`${attempts} attempts.`);
}

function handlePermissionDenied(error) {
  $text.text("");
  $p = $('<p></p>');
  $p.append("<b>\"I shoot\" should be played on a desktop or laptop computer with a microphone. You need to give permission to use the microphone to play.");
  $text.append($p);
  annyangError = true;
}

function handlePermissionBlocked(error) {
  $text.text("");
  $p = $('<p></p>');
  $p.append("<b>\"I shoot\" should be played on a desktop or laptop computer with a microphone. You need to give permission to use the microphone to play.");
  $text.append($p);
  annyangError = true;
}
