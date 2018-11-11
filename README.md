## Filler game as react app!

### Get started
Run the following commands in the terminal of your choice:

```
git clone https://github.com/DarkSmile92/fillter-game-react.git filler-game-react
cd filler-game-react
yarn
yarn start
```

### Tweaks
#### Suggestions
Right now the game finds the best next step simply by calculating the max number of cells possibly to acquire with each color and using the max value as suggestion.
The button with that color will be rendered with a border.
If there are more than one equal possibillities, only the first is taken into consideration.

### Solving algorhythm
At the moment there is no algorhythm to take steps automatically.
Take on the challenge, create solvers under the `./src/solver/` path and share them!