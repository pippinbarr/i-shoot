/*

Annyang command prototype

To be able to test what kinds of commands register and what
kind of commands... don't.

*/

var commands = [
  "I run north",
  // "I run up the ramp",
  // "I run up the incline",
  // "I run through the door",
  // "I run through the double doors",
  // "I run through the doorway",
  // "I run through the tunnel",
  // "I run down the stairs",
  // "I run west into the open area",
  // "I run up the long street",
  // "I run around the corner",
  // "I run toward the sound of gunfire",
  // "I past the pharmacy and around the corner",
  // "I run across the bridge and into the narrow alley",
  // "I run through the tunnel and out into the courtyard",
  //
  // "I take out my pistol",
  // "I raise my pistol",
  // "I take out my USPS dash S pistol",
  //
  // "I shoot him",
  // "I shoot him in the face",
  // "I shoot the terrorist twice in the face",
  // "I shoot the man in the back of the head",
  // "I sneak toward him and shoot him in the side of the head",
  // "I shoot him quickly twice in the back of the head",
  // "I shoot him in the stomach",
  // "I fire two shots at his chest",
  // "I fire two shots at his center mass",
  // "I reflexively shoot at him",
  // "I squeeze off two shots at his head",
  //
  // "I take out my knife",
  // "I pull out my knife",
  //
  // "I stab him",
  // "I stab him in the stomach",
  // "I stab him repeatedly in the stomach",
  // "I stab him in the back",
  // "I stab in him the chest with my knife",
  // "I slash across his throat with my knife",
  //
  // "He crumples to the ground",
  // "He collapses backward",
  // "He slumps onto the ground",
  // "He stumbles back into a wall and collapses",
  // "He drops to the ground like a sack of rocks",
  // "He falls to the ground",
  // "He tumbles to the ground",
  //
  // "Blood sprays against the wall",
  // "Blood coats the ground behind him",
  // "His blood decorates the walls",
  // "His blood splashes onto the ground",
  //
  // "He lies motionless",
  // "He dies instantly",
  // "He lies face down in the dust",
  // "He lies on his back with unseeing eyes",
  // "He's dead",
  // "The terrorist lies dead on the dusty floor",
  // "His dead eyes look up at the blue sky",
];

var currentCommand = -1;
var attempts = 0;
var misheard = [];

$(document).ready(function() {

  if (annyang) {
    console.log("annyang is available.");

    // We tell annyang to start listening with its
    // .start() function
    annyang.start();

    // Set up for mishearings
    annyang.addCallback('resultNoMatch', handleMishearing);

    setupCommand();
  }

});

function setupCommand() {
  attempts = 0;
  currentCommand++;

  if (currentCommand >= commands.length) {
    annyang.pause();
    return;
  }

  misheard = [];

  var annyangCommands = {};

  $('#commands').append("<p id=\"command" + currentCommand + "\">" + commands[currentCommand] + "</p>");

  $('#command' + currentCommand).css({
    backgroundColor: "yellow"
  });

  annyangCommands[commands[currentCommand].toLowerCase()] = function() {
    $('#command' + currentCommand).css({
      backgroundColor: "green"
    });

    setupCommand();
  }

  annyang.addCommands(annyangCommands);
}


function handleMishearing(possibles) {
  attempts++;

  possibles.forEach(function (phrase) {
    if (misheard.indexOf(phrase.toLowerCase()) === -1) {
      misheard.push(phrase.toLowerCase());
    }
  });

  $('#command' + currentCommand).effect('shake',function () {
    if (attempts >= 3) {

      $('#command' + currentCommand).css({
        backgroundColor: "red"
      });

      var mishearings = "";
      misheard.forEach(function (misheardCommand) {
        mishearings += misheardCommand + ", "
      });

      $('#commands').append("<p>Mishearings: " + mishearings + "</p>");

      setupCommand();
    }
  });
}
