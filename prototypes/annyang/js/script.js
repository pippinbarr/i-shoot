/*

Speech prototype

*/

var currentText = "longCorner";

$(document).ready(function() {

  if (annyang) {
    console.log("annyang is available.");

    // We tell annyang to start listening with its
    // .start() function
    annyang.start();

    setupCurrentText();
  }

});

function setupCurrentText() {
  annyang.removeCommands();

  $('body').append(texts[currentText].text + "<p>");

  var commands = {};

  for (let i = 0; i < texts[currentText].commands.length; i++) {
    commands[texts[currentText].commands[i].command] = function () {

      executeCommand(texts[currentText].commands[i].destination);
    }
    $('body').append(texts[currentText].commands[i].command + "<p>");
  }

  // Now we've defined the commands we give them to annyang
  // by using its .addCommands() function.
  annyang.addCommands(commands);
}

function executeCommand(commandDestination) {
  console.log("Executing command to destination: " + commandDestination)
  currentText = commandDestination;
  setupCurrentText();
}


var texts =
{
  longCorner: {
    text: "The four bodies of the other counter-terrorist operatives are strewn around the area alongside two terrorist corpses. Blood spatters the dusty ground and walls and pistols litter the area.\n\nA terrorist, bandanas masking his entire face, stands near the doors, a pistol levelled at my head.",
    commands: [
      {
        command: "I run down the street to the north",
        destination: "longCorner"
      },
      {
        command: "I aim at him and pull the trigger",
        destination: "shootTerrorist1"
      },
    ]
  },
  shootTerrorist1: {
    text: "",
    commands: [
      {
        command: "I fire two quick shots",
        destination: "shootTerrorist2"
      }
    ]
  },
  shootTerrorist2: {
    text: "",
    commands: [
      {
        command: "Both hit him in the head",
        destination: "shootTerrorist3"
      }
    ]
  },
  shootTerrorist3: {
    text: "",
    commands: [
      {
        command: "Blood splashes against the wall behind him as he drops to the ground",
        destination: "shootTerrorist4"
      }
    ]
  },
  shootTerrorist4: {
    text: "",
    commands: [
      {
        command: "He lies motionless on his back neutralised head turned to one side",
        destination: "longCorner"
      }
    ]
  }
}
