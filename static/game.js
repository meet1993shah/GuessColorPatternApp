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
                        alert("Congratulations! You won!");
                    } else {
                        alert("You lost! The secret code was: " + response.secret_code.join(", "));
                    }
                    window.location.href = "/";
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

    // Restart game
    $("#restart-game").click(function() {
        window.location.href = "/restart";
    });

    // Accept defeat
    $("#accept-defeat").click(function() {
        $.post("/accept_defeat", function(response) {
            alert("You lost! The secret code was: " + response.secret_code.join(", "));
            window.location.href = "/";
        });
    });
});
