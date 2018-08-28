/*

Untitled Voice Shooter
Pippin Barr

*/

// Track current location (in world and in JSON)
var currentPlace = "longCorner";
// To store the object that comes from JSON
var places;
// To number passages as we display them for jQuery effects
var passage = 0;

$(document).ready(function() {

  // Obviously we need annyang
  if (annyang) {
    // We tell annyang to start listening with its
    // .start() function
    annyang.start();

    // Load the data
    $.getJSON("data/data.json","",onDataLoaded)
    .fail(onDataFailed);
  }

});

// onDataFailed()
//
// Shit.
function onDataFailed() {
  console.log("Shit.");
}

// onDataLoaded()
//
// Store the data in our variable and start displaying the game
function onDataLoaded(data) {
  console.log("Loaded.");

  places = data;
  displayCurrentPassage();
}

// displayCurrentPassage()
//
// Sets up annyang with the commands for this passage,
// displays the passage description and commands
function displayCurrentPassage() {

  // Reset annyang
  annyang.removeCommands();

  // Go through the description paragraph by paragraph and add to the page
  for (let i = 0; i < places[currentPlace].description.length; i++) {
    $('#text').append("<p class=\"passage" + passage + "\">" + places[currentPlace].description[i] + "</p>");
  }

  // Build our annyang commands and the display version
  var annyangCommands = {};
  var displayCommands = "";

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
    // annyangCommands["*words"] = function(words) {
    // console.log("I heard: " + words);
    // }

    // Build the display version of the commands
    displayCommands += "<p class=\"command passage" + passage + "\" id=\"" + destination + "\">" + description + "</p>";
  }

  // Add the commands to the page
  $("#text").append(displayCommands);

  // Fade this passage in
  $(".passage" + passage).hide().fadeIn();

  // Increment passage counter
  passage++;

  // Now we've defined the commands we give them to annyang
  // by using its .addCommands() function.
  annyang.addCommands(annyangCommands);
}

// executeCommand()
//
// Does some nice jQuery animation to transition
// and moves to the requested passage based on the command
function executeCommand(commandDestination,commandDescription) {
  console.log("Executing command to destination: " + commandDestination);

  // Update current place
  currentPlace = commandDestination;

  // Fade out and slide up all the commands that weren't the one issued
  $('.command').not("#" + commandDestination).animate({
    opacity: 0
  },function () {
    $(this).slideUp(function () {
      setupCurrentText();
    });
  });

  // Change the text of the command issues to be regular text
  // and stop it being a command for that destination
  $("#" + commandDestination).removeClass("command",1000);
  $("#" + commandDestination).removeAttr('id');
}
