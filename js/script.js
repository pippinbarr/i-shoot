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
        displayCurrentPassage();
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

// displayCurrentPassage()
//
// Sets up annyang with the commands for this passage,
// displays the passage description and commands
function displayCurrentPassage() {

  // Increment passage counter
  passage++;

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
    let command = commands[i].command.toLowerCase();
    let destination = commands[i].destination;
    let display = commands[i].command;

    // Build the display version of the command
    let $command = $('<p></p>');
    $command.addClass(`command-${passage}`);
    $command.addClass('command');
    $command.attr('id',destination);
    $command.append(`"${display}."`);

    if (makeClickable) {
      // Style the element as clickable
      $command.addClass('clickable');
      // Add a click event that executes its command and makes it unclickable
      $command.on('click', function () {
        execute($command,move,{destination: destination});
        $(this).off('click');
        $(this).removeClass('clickable');
      });
    }

    $commands.append($command);

    // Add the command to our object
    annyangCommands[command] = function () {
      // Handler function should know destination and description of command
      // for moving through story and for jQuery effects
      execute($command,move,{destination: destination});
    }

  }

  // Add an encounter if necessary
  let r = Math.random();
  if (r < 1.0) {
    let $p = $('<p></p>');
    $p.addClass(`passage-${passage}`);
    $p.addClass(`text-${passage}`);
    $p.append(encounters["T1"].description);
    $passage.append($p);

    let $command = $('<p></p>');
    $command.addClass(`command-${passage}`);
    $command.addClass('command');
    $command.attr('id',"T1-"+0);

    let killCommands = encounters["T1"].commands;
    let killIndex = 0;

    let firstCommand = killCommands[killIndex];
    $command.append(`"${firstCommand}."`);

    if (makeClickable) {
      // Style the element as clickable
      $command.addClass('clickable');
      // Add a click event that executes its command and makes it unclickable
      $command.on('click', function () {
        execute($command,kill,{steps:killCommands,index:killIndex});
        $(this).off('click');
        $(this).removeClass('clickable');
      });
    }

    $commands.append($command);

    annyangCommands[firstCommand] = function () {
      execute($command,kill,{steps:killCommands,index:killIndex});
    }
  }

  // Add everything to the page
  $text.append($passage);
  $text.append($commands);

  $passage.css('opacity',0);
  $commands.css('opacity',0);

  if ($commands.offset().top + $commands.height() > $(window).height()) {
    scrollToPassage();
  }
  else {
    fadeInPassage();
  }

  function scrollToPassage() {
    $('html, body').animate({
      scrollTop: $commands.offset().top + $commands.height()
    },1000,fadeInPassage);
  }

  function fadeInPassage() {
    $passage.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
      $commands.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
      });
    });

  }

  // Reset annyang's commands
  annyang.removeCommands();

  // Now we've defined the commands we give them to annyang
  // by using its .addCommands() function.
  annyang.addCommands(annyangCommands);

  // Set up for mishearings
  annyang.addCallback('resultNoMatch', handleMishearing);
}

// executeCommand()
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

  displayCurrentPassage();
}

function kill(data) {
  let steps = data.steps;
  let index = data.index;

  index++;

  if (index === steps.length) {
    move({destination:currentPlace});
  }
  else {
    // Increment passage counter
    passage++;

    let $commands = $('<div></div>');

    let $command = $('<p></p>');
    $command.addClass(`command-${passage}`);
    $command.addClass('command');
    $command.attr('id',"T1-"+index);

    let killCommands = steps;
    let killIndex = index;

    let nextCommand = killCommands[killIndex];
    $command.append(`"${nextCommand}."`);

    if (makeClickable) {
      // Style the element as clickable
      $command.addClass('clickable');
      // Add a click event that executes its command and makes it unclickable
      $command.on('click', function () {
        execute($command,kill,{steps:killCommands,index:killIndex});
        $(this).off('click');
        $(this).removeClass('clickable');
      });
    }

    $commands.append($command);
    $text.append($commands);

    $commands.css('opacity',0);

    if ($commands.offset().top + $commands.height() > $(window).height()) {
      scrollToPassage();
    }
    else {
      fadeInPassage();
    }

    function scrollToPassage() {
      $('html, body').animate({
        scrollTop: $commands.offset().top + $commands.height()
      },1000,fadeInPassage);
    }

    function fadeInPassage() {
      $passage.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
        $commands.animate({opacity:1},PASSAGE_FADE_IN_TIME,function() {
        });
      });
    }

    let annyangCommands = {};
    annyangCommands[nextCommand.toLowerCase()] = function () {
      execute($command,kill,{steps:killCommands,index:killIndex});
    }

    // Reset annyang's commands
    annyang.removeCommands();

    // Now we've defined the commands we give them to annyang
    // by using its .addCommands() function.
    annyang.addCommands(annyangCommands);

    // Set up for mishearings
    annyang.addCallback('resultNoMatch', handleMishearing);
  }
}

function handleMishearing(possibles) {
  // console.log("==================================================");
  // console.log("Didn't understand. Here's what I might have heard:");
  // console.log(possibles);
  // console.log("==================================================");

  attempts++;

  if (attempts === MAX_ATTEMPTS) {
    makeCommandsClickable();
  }
}

function makeCommandsClickable() {
  let commands = map[currentPlace].commands;

  for (let i = 0; i < commands.length; i++) {
    // Store the components nicely
    let command = commands[i].command;
    let destination = commands[i].destination;

    // Style the element as clickable
    $('#' + destination).addClass('clickable');
    // Add a click event that executes its command and makes it unclickable
    $('#' + destination).on('click', function () {
      moveTo(destination,$('#' + destination));
      $(this).off('click');
      $(this).removeClass('clickable');
    });
  }
}
