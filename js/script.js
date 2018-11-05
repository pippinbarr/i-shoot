/*

Untitled Voice Shooter
Pippin Barr

*/

// Track current location (in world and in JSON)
var currentPlace = 'longCorner';
// To store the object that comes from JSON
var places;
// To number passages as we display them for jQuery effects
var passage = 0;
// Attempts made at the current command set
const MAX_ATTEMPTS = 1;
var attempts = 0;
// For a reference to the game text
var $text;

const PASSAGE_FADE_IN_TIME = 1000;
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
function onDataLoaded(data) {
  console.log('Game data loaded.');

  places = data;
  displayCurrentPassage();
}

// displayCurrentPassage()
//
// Sets up annyang with the commands for this passage,
// displays the passage description and commands
function displayCurrentPassage() {

  // Reset annyang's commands
  annyang.removeCommands();

  // Go through the description paragraph by paragraph and add to the page
  for (let i = 0; i < places[currentPlace].description.length; i++) {
    let $p = $('<p></p>');
    $p.addClass('passage' + passage);
    $p.append(places[currentPlace].description[i]);
    $text.append($p);
  }

  // Build our annyang commands and the display version
  let annyangCommands = {};
  let $commands = $('<div></div>');

  // Go through all the commands
  for (let i = 0; i < places[currentPlace].commands.length; i++) {

    // Store the components nicely
    let command = places[currentPlace].commands[i].command;
    let destination = places[currentPlace].commands[i].destination;
    let description = places[currentPlace].commands[i].description;

    // Add each command to our object
    annyangCommands[command] = function () {
      // Handler function should know destination and description of command
      // for moving through story and for jQuery effects
      executeCommand(destination,description);
    }

    // Using the splat tag thing seems to sabotage the actual commands?
    // annyangCommands['*words'] = function(words) {
    // console.log('I heard: ' + words);
    // }

    // Build the display version of the commands
    let $command = $('<p></p>');
    $command.addClass('command passage' + passage);
    $command.attr('id',destination);
    $command.append(description);
    $commands.append($command);
  }

  // Add the commands to the page
  $('#text').append($commands);

  // Fade this passage in
  $('.passage' + passage).hide().fadeIn(PASSAGE_FADE_IN_TIME);

  // Increment passage counter
  passage++;

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
function executeCommand(commandDestination,commandDescription) {
  console.log('Executing command to destination: ' + commandDestination);

  // Update current place
  currentPlace = commandDestination;

  // Fade out and slide up all the commands that weren't the one issued
  $('.command').not('#' + commandDestination).animate({
    opacity: 0
  }, COMMAND_FADE_OUT_TIME, function () {
    $(this).slideUp(COMMAND_SLIDE_UP_TIME, function () {
      $(this).remove();
    });
  });

  // Change the text of the command issues to be regular text
  // and stop it being a command for that destination
  $('#' + commandDestination).removeClass('command');
  $('#' + commandDestination).removeAttr('id');

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
  for (let i = 0; i < places[currentPlace].commands.length; i++) {
    // Store the components nicely
    let command = places[currentPlace].commands[i].command;
    let destination = places[currentPlace].commands[i].destination;
    let description = places[currentPlace].commands[i].description;

    $('#' + destination).addClass('clickable');
    $('#' + destination).on('click', function () {
      console.log("click");
      executeCommand(destination,description);
      $(this).off('click');
      $(this).removeClass('clickable',1000);
    });
  }
}
