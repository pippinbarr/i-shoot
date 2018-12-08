/*

"I shoot"
Pippin Barr

*/


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
  console.log('startGame()');
  if (annyangError) {
    return;
  }

  move({destination: currentPlace, long: true, clear: true });
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

function makeCommandsClickable() {
  $('.command').each(function () {
    // Style the element as clickable
    $(this).addClass('clickable');
    // Add a click event that executes its command and makes it unclickable
    $(this).on('click', function () {
      // execute($(this),$(this).data('handler'),$(this).data('data'));
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
  console.log("!!! Microphone permission denied.")
  $text.text("");
  $p = $('<p></p>');
  $p.append("<b>\"I shoot\" should be played on a desktop or laptop computer with a microphone. You need to give permission to use the microphone to play.");
  $text.append($p);
  annyangError = true;
}

function handlePermissionBlocked(error) {
  console.log("!!! Microphone permission blocked.")
  $text.text("");
  $p = $('<p></p>');
  $p.append("<b>\"I shoot\" should be played on a desktop or laptop computer with a microphone. You need to give permission to use the microphone to play.");
  $text.append($p);
  annyangError = true;
}
