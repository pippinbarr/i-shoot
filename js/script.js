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

let makeClickable = true;

// Start annyang and load the game data
$(document).ready(function() {
  // We need annyang to be loaded or we're screwed
  if (annyang) {
    // Save a reference to the game text
    $text = $('#text');

    // Tell annyang to start listening
    annyang.start();

    // Load the data
    $.getJSON('data/map.json','',function (loadedData) {
      map = loadedData;
      $.getJSON('data/encounters.json','',function (loadedData) {
        encounters = loadedData;
        move({destination: currentPlace});
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

// execute()
//
// Does some nice jQuery animation to transition
// and moves to the requested passage based on the command
function execute($command,handler,data) {
  console.log('>>> Executing:' + $command.text());

  $selected = $command;

  // Transform the chosen command to remove the quote-marks (it has become an action)
  let display = $selected.text();
  display = display.replace(/\"/g,'');

  $selected.text(`${display}`);
  $selected.removeClass('command');
  $selected.addClass('commanded');
  $selected.removeAttr('id');
  $selected.removeClass('clickable');

  // Fade out and slide up all the commands that weren't the one issued
  $unselected = $('.command').not($selected);

  if ($unselected.length !== 0) {
    let handled = false;
    $unselected.animate({
      opacity: 0
    }, COMMAND_FADE_OUT_TIME, function () {
      $(this).slideUp(COMMAND_SLIDE_UP_TIME, function () {
        if (!handled) {
          handled = true;
          handler(data);
        }
        $(this).remove();
      });
    });
  }
  else {
    handler(data);
  }
}

function move(data) {
  // Update current place
  currentPlace = data.destination;

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
    $p.append(map[currentPlace].description[i].text);
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

  // Build our annyang commands and the display version
  let annyangCommands = {};
  let $commands = $('<div></div>');

  // Go through all the commands
  let commands = map[currentPlace].commands;
  for (let i = 0; i < commands.length; i++) {
    // Store the components nicely
    let command = commands[i].command;
    let destination = commands[i].destination;
    let $command = buildCommand({command:command,id:destination},move,{destination: destination});
    $commands.append($command);

    // Add the command to our object
    annyangCommands[command.toLowerCase()] = function () {
      // Handler function should know destination and description of command
      // for moving through story and for jQuery effects
      execute($command,move,{destination: destination});
    }
  }

  // Add an encounter if necessary
  if (Math.random() < 1.0) {
    addTerroristEncounter($passage,$commands,annyangCommands);
  }

  // Add everything to the page
  $text.append($passage);
  $text.append($commands);

  scrollToCommands($passage,$commands);
  setAnnyangCommands(annyangCommands);
}

function addTerroristEncounter($passage,$commands,annyangCommands) {
  let $p = $('<p></p>');
  $p.addClass(`passage-${passage}`);
  $p.addClass(`text-${passage}`);
  $p.append(encounters["T1"].description);
  $passage.append($p);

  let id = "T1-0"

  let commandText = encounters["T1"].commands[0];
  let data = {
    commands: encounters["T1"].commands,
    index: 0
  };
  let $command = buildCommand({
    id: id,
    command: commandText
  },kill,data);

  $commands.append($command);

  annyangCommands[commandText.toLowerCase()] = function () {
    execute($command,kill,{commands:encounters["T1"].commands,index:0});
  }
}

function kill(data) {
  passage++;
  data.index++;

  if (data.index === data.commands.length) {
    move({ destination:currentPlace });
  }
  else {
    let annyangCommands = {};
    let command = { command: data.commands[data.index], id: "T1-"+passage };
    let $passage = $('<div></div>');
    let $commands = $('<div></div>');
    let $command = buildCommand(command,kill,data);
    $commands.append($command);
    annyangCommands[$command.text().toLowerCase()] = function () {
      execute($command,kill,data);
    }
    $text.append($commands);
    setAnnyangCommands(annyangCommands);
    scrollToCommands($passage,$commands);
  }
}

function setAnnyangCommands(annyangCommands) {
  // Reset annyang's commands
  annyang.removeCommands();

  // Now we've defined the commands we give them to annyang
  // by using its .addCommands() function.
  annyang.addCommands(annyangCommands);

  // Set up for mishearings
  annyang.addCallback('resultNoMatch', handleMishearing);
}

function buildCommand(command,handler,data) {
  console.log(`Building ${command.id}: ${command.command}`)
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

function scrollToCommands($passage,$commands) {
  $passage.css('opacity',0);
  $commands.css('opacity',0);

  if ($commands.offset().top + $commands.height() > $(window).height()) {
    scrollToNext();
  }
  else {
    fadeInNext();
  }

  function scrollToNext() {
    $('html, body').animate({
      scrollTop: $commands.offset().top + $commands.height()
    },1000,fadeInNext);
  }

  function fadeInNext() {
    $passage.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
      $commands.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
      });
    });
  }
}

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
