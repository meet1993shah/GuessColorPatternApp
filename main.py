from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import random

app = Flask(__name__)
app.secret_key = os.urandom(24)

class GuessColor:
    def __init__(self, code_length):
        self.code_length = code_length
        self.colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple']
        self.secret_code = self.generate_secret_code()
        self.grid_history = []
        self.guesses_left = (2 * self.code_length) + 2

    def generate_secret_code(self):
        return [random.choice(self.colors) for _ in range(self.code_length)]

    def generate_map(self, code):
        return {color: code.count(color) for color in self.colors}

    def get_feedback(self, guess):
        if self.guesses_left <= 0:
            return None, None  # No guesses allowed

        bulls, cows = 0, 0
        for i in range(self.code_length):
            if guess[i] == self.secret_code[i]:
                bulls += 1
                cows -= 1

        guess_map = self.generate_map(guess)
        secret_map = self.generate_map(self.secret_code)
        for color in self.colors:
            cows += min(guess_map[color], secret_map[color])

        return bulls, cows

    def add_grid_row(self, guess, bulls, cows):
        self.grid_history.append({"guess": guess, "bulls": bulls, "cows": cows})


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        code_length = int(request.form['code_length'])
        session['player_name'] = request.form['player_name']
        session['code_length'] = code_length
        session['game'] = GuessColor(code_length).__dict__  # Store object state in session
        return redirect(url_for('game'))
    return render_template('index.html')

@app.route('/game')
def game():
    if 'game' not in session:
        return redirect(url_for('index'))
    return render_template('game.html', player_name=session['player_name'], code_length=session['code_length'])

@app.route('/guess', methods=['POST'])
def guess():
    if 'game' not in session:
        return jsonify({'error': 'Game session not found'}), 400

    game_data = session['game']
    game = GuessColor(game_data['code_length'])
    game.__dict__.update(game_data)  # Restore object state

    if game.guesses_left <= 0:
        return jsonify({'error': 'No more guesses available'}), 400

    guess = request.get_json().get('guess')

    if not guess or len(guess) != game.code_length:
        return jsonify({'error': 'Invalid guess'}), 400

    game.guesses_left -= 1
    bulls, cows = game.get_feedback(guess)
    game.add_grid_row(guess, bulls, cows)

    session['game'] = game.__dict__  # Save updated state

    if bulls == game.code_length:
        return jsonify({'game_status': 'inactive', 'status': 'won'})
    elif game.guesses_left <= 0:
        return jsonify({'game_status': 'inactive', 'status': 'lost', 'secret_code': game.secret_code})
    else:
        return jsonify({'game_status': 'active', 'grid_history': game.grid_history, 'guesses_left': game.guesses_left})

@app.route('/restart')
def restart():
    session.clear()
    return redirect(url_for('index'))

@app.route('/accept_defeat', methods=['POST'])
def accept_defeat():
    if 'game' in session:
        return jsonify({'game_status': 'inactive', 'status': 'lost', 'secret_code': session['game']['secret_code']})
    return jsonify({'error': 'No game session found'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
