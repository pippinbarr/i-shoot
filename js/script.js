/*

"I shoot"
Pippin Barr

*/

// Track current location (in world and in JSON)
let currentPlace = 'CT_Spawn';
// To store the object that comes from JSON
let data;
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

// Start annyang and load the game data
$(document).ready(function() {
  // We need annyang to be loaded or we're screwed
  if (annyang) {
    // Save a reference to the game text
    $text = $('#text');

    // Tell annyang to start listening
    annyang.start();

    // Load the data
    $.getJSON('data/data.json','',onDataLoaded)
    .fail(onDataFailed);
  }
});

// onDataFailed()
//
// Shit.
function onDataFailed() {
  console.log('Shit.');
}

// onDataLoaded()
//
// Store the data in our variable and start displaying the game
function onDataLoaded(loadedData) {
  console.log('>>> Game data loaded.');

  data = loadedData;
  displayCurrentPassage();
}

// displayCurrentPassage()
//
// Sets up annyang with the commands for this passage,
// displays the passage description and commands
function displayCurrentPassage() {

  // Increment passage counter
  passage++;

  // Reset annyang's commands
  annyang.removeCommands();

  $passage = $('<div></div>');

  // Go through the description paragraph by paragraph and add to the page
  for (let i = 0; i < data[currentPlace].description.length; i++) {
    if (!eval(data[currentPlace].description[i].test)) continue;
    let $p = $('<p></p>');
    $p.addClass('passage' + passage);
    $p.addClass('text-' + passage);
    $p.append(data[currentPlace].description[i].text);
    $passage.append($p);
  }

  $text.append($passage);

  // Build our annyang commands and the display version
  let annyangCommands = {};
  let $commands = $('<div></div>');

  // Go through all the commands
  for (let i = 0; i < data[currentPlace].commands.length; i++) {
    // Store the components nicely
    let command = data[currentPlace].commands[i].command;
    let destination = data[currentPlace].commands[i].destination;
    let display = data[currentPlace].commands[i].display;

    // Add each command to our object
    annyangCommands[command] = function () {
      // Handler function should know destination and description of command
      // for moving through story and for jQuery effects
      executeCommand(destination,text);
    }

    // Build the display version of the commands
    let $command = $('<p></p>');
    $command.addClass('command-' + passage);
    $command.addClass('command');
    $command.attr('id',destination);
    $command.append(`"${display}."`);
    $commands.append($command);
  }

  // Add the commands to the page
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

  // Fade this passage in



  // Now we've defined the commands we give them to annyang
  // by using its .addCommands() function.
  annyang.addCommands(annyangCommands);

  // Set up for mishearings
  annyang.addCallback('resultNoMatch', handleMishearing);

  makeCommandsClickable();
}

// executeCommand()
//
// Does some nice jQuery animation to transition
// and moves to the requested passage based on the command
function executeCommand(destination,description) {
  console.log('>>> Executing command to: ' + destination);

  // Update current place
  currentPlace = destination;

  // Fade out and slide up all the commands that weren't the one issued
  $('.command').not('#' + destination).animate({
    opacity: 0
  }, COMMAND_FADE_OUT_TIME, function () {
    $(this).slideUp(COMMAND_SLIDE_UP_TIME, function () {
      $(this).remove();
    });
  });

  // Change the text of the command issues to be regular text
  // and stop it being a command for that destination
  $('#' + destination).removeClass('command');
  $('#' + destination).removeAttr('id');

  // Reset attempts now that we've successfully issued a command
  attempts = 0;

  setTimeout(displayCurrentPassage,COMMAND_FADE_OUT_TIME + COMMAND_SLIDE_UP_TIME + 100);
}

function handleMishearing(possibles) {
  console.log("==================================================");
  console.log("Didn't understand. Here's what I might have heard:");
  console.log(possibles);
  console.log("==================================================");

  attempts++;

  if (attempts === MAX_ATTEMPTS) {
    makeCommandsClickable();
  }
}

function makeCommandsClickable() {
  for (let i = 0; i < data[currentPlace].commands.length; i++) {
    // Store the components nicely
    let command = data[currentPlace].commands[i].command;
    let destination = data[currentPlace].commands[i].destination;
    let description = data[currentPlace].commands[i].description;

    // Style the element as clickable
    $('#' + destination).addClass('clickable');
    // Add a click event that executes its command and makes it unclickable
    $('#' + destination).on('click', function () {
      executeCommand(destination,description);
      $(this).off('click');
      $(this).removeClass('clickable');
    });
  }
}
