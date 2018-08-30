/*

Annyang command prototype

To be able to test what kinds of commands register and what
kind of commands... don't.

*/

var commands = [
  "I run north",
  "I run to the north",
  "I run up the ramp",
  "I run up the incline",
  "I run down the incline",
  "I run through the doors",
  "I run through the double doors",
  "I run through the doorway",
  "I run through the tunnel",
  "I run down the stairs",
  "I run west into the open area",
  "I run up the long street",
  "I run down the street",
  "I run around the corner",

  "I hide behind a crate",
  "I hide behind the car",

  "I take out my pistol",
  "I raise my pistol",

  "I shoot him",
  "I shoot him in the face",
  "I shoot him twice in the face",
  "I shoot him in the back of the head",
  "I shoot him in the side of the head",
  "I shoot him quickly twice in the back of the head",
  "I shoot him in the stomach",
  "I reflexively shoot at him",

  "I take out my knife",

  "I stab him",
  "I stab him in the stomach",
  "I stab him repeatedly in the stomach",
  "I stab him in the back",

  "He crumples to the ground",
  "He collapses backward",
  "He slumps onto the ground",
  "He stumbles back into a wall then falls",
  "He drops to the ground",
  "He tumbles to the ground",

  "Blood sprays back against the wall",
  "Blood spatters the wall behind him",
  "Blood coats the ground behind him",
  "His blood sprays onto the ground",
  "His blood spurts onto the ground",

  "He lies motionless",
  "He dies instantly",
  "He lies face down in the dust",
  "He lies on his back with unseeing eyes",
];

$(document).ready(function() {

  if (annyang) {
    console.log("annyang is available.");

    // We tell annyang to start listening with its
    // .start() function
    annyang.start();

    setupCommands();
  }

});

function setupCommands() {
  var annyangCommands = {};
  for (let i = 0; i < commands.length; i++) {

    $('#commands').append("<p id=\"command" + i + "\">" + commands[i] + "</p>");

    annyangCommands[commands[i].toLowerCase()] = function() {
      console.log(commands[i]);
      $('#command' + i).css({
        backgroundColor: "yellow"
      });
    }
  }

  // Wildcard for testing
  // annyangCommands = {
  //   "*words": function (words) {
  //     console.log(words);
  //   }
  // }

  annyang.addCommands(annyangCommands);
  annyang.addCallback('resultNoMatch', function (possibles) {
    console.log("No match. Maybe heard:");
    possibles.forEach(function (el) {
      console.log(el);
    });
  });
}
