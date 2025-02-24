$(document).ready(function() {
    const playerName = localStorage.getItem('playerName');
    $("#player-name").text(playerName);

    const codeLength = parseInt(localStorage.getItem('codeLength'));
    let currentGuess = [];

    // Initialize empty guess slots
    function resetGuess() {
        currentGuess = [];
        $("#current-guess").empty();
        for (let i = 0; i < codeLength; i++) {
            $("#current-guess").append('<div class="guess-slot empty"></div>');
        }
    }
    resetGuess();

    // Handle color selection
    $(".color-box").click(function() {
        if (currentGuess.length < codeLength) {
            let color = $(this).data("color");
            currentGuess.push(color);

            $("#current-guess .empty").first().removeClass("empty").addClass(color).data("color", color);
        }
    });

    // Submit guess
    $("#submit-guess").click(function() {
        if (currentGuess.length !== codeLength) {
            alert("Please select all colors before submitting.");
            return;
        }

        $.ajax({
            url: "/guess",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ guess: currentGuess }),
            success: function(response) {
                if (response.game_status === "inactive") {
                    if (response.status === "won") {
                        triggerConfetti(); // Show ribbons on win
                        displayWinMessage(); // Display win message
                    } else {
                        triggerRainEffect(); // Show rain effect on loss
                        displayLossMessage(response.secret_code); // Display loss message and secret code
                    }
                    return;
                } else {
                    updateGuessHistory(response.grid_history);
                    resetGuess();
                }
            },
            error: function(xhr) {
                alert(xhr.responseJSON.error);
            }
        });
    });

    // Update guess history grid
    function updateGuessHistory(gridHistory) {
        $("#guess-history").empty();
        gridHistory.forEach(function(entry) {
            let guess = entry.guess;
            let bulls = entry.bulls;
            let cows = entry.cows;

            let row = $('<div class="guess-row"></div>');
            guess.forEach(color => {
                row.append(`<div class="guess-slot ${color}"></div>`);
            });

            let feedback = $('<div class="feedback"></div>');
            for (let i = 0; i < bulls; i++) {
                feedback.append('<div class="pin black"></div>');
            }
            for (let i = 0; i < cows; i++) {
                feedback.append('<div class="pin white"></div>');
            }

            row.append(feedback);
            $("#guess-history").append(row);
        });
    }

    // Trigger confetti (ribbons) effect on win
    function triggerConfetti() {
        let duration = 5000;
        let end = Date.now() + duration;

        function frame() {
            confetti({
                particleCount: 5,
                spread: 100,
                startVelocity: 40,
                origin: { x: Math.random(), y: Math.random() }
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }

        frame();
    }

    // Trigger rain effect on loss
    function triggerRainEffect() {
        let rainDuration = 5000;
        let endTime = Date.now() + rainDuration;
        
        let rainInterval = setInterval(function() {
            if (Date.now() > endTime) {
                clearInterval(rainInterval);
            } else {
                const rainDrop = $('<div class="rain-drop">🌧️</div>');
                rainDrop.css({
                    left: `${Math.random() * 100}%`,
                    animation: 'fall 1s linear infinite'
                });
                $('body').append(rainDrop);
                setTimeout(() => rainDrop.remove(), 1000);
            }
        }, 200);
    }

    // Display win message
    function displayWinMessage() {
        let message = $("<div class='win-message'>You won! 🎉</div>");
        $("body").prepend(message);
        setTimeout(() => message.fadeOut(), 3000); // Hide after 3 seconds
    }

    // Display loss message and secret code
    function displayLossMessage(secretCode) {
        let message = $("<div class='loss-message'>You lost! The secret code was: </div>");
        let codeDisplay = $("<div id='secret-code'></div>");
        secretCode.forEach(color => {
            codeDisplay.append(`<div class='guess-slot ${color}'></div>`);
        });

        $("body").prepend(message);
        $("body").prepend(codeDisplay);
        setTimeout(() => {
            message.fadeOut();
            codeDisplay.fadeOut();
        }, 5000); // Hide after 5 seconds
    }

    // Restart game
    $("#restart-game").click(function() {
        window.location.href = "/restart";
    });

    // Accept defeat
    $("#accept-defeat").click(function() {
        $.post("/accept_defeat", function(response) {
            alert("You lost! The secret code was: ");
            displaySecretCode(response.secret_code); // Display secret code with colors
            window.location.href = "/";
        });
    });
});
