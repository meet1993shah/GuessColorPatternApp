$(document).ready(function() {
    $('#game-setup').submit(function(event) {
        event.preventDefault(); // Prevent default form submission

        const playerName = $('#player_name').val();
        const codeLength = $('#code_length').val();

        if (!playerName.trim()) {
            alert('Please enter a player name.');
            return;
        }

        // Store player name and code length in local storage.
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('codeLength', codeLength);

        // Submit the form properly
        this.submit();
    });
});
