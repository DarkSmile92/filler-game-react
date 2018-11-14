## Filler game as react app!

### Get started
Run the following commands in the terminal of your choice:

```
git clone https://github.com/DarkSmile92/filler-game-react.git filler-game-react
cd filler-game-react
yarn
yarn start
```

### Demo
Visit https://darksmile92.github.io/filler-game-react/ for a demo.

### Tweaks
#### Suggestions
Right now the game finds the best next step simply by calculating the max number of cells possibly to acquire with each color and using the max value as suggestion.
The button with that color will be rendered with a border.
If there are more than one equal possibillities, only the first is taken into consideration.

### Solving algorhythm
At the moment there is no algorhythm to take steps automatically.
Take on the challenge, create solvers under the `./src/solver/` path and share them!

### Debugging with Visual Studio Code
First install the extension [Chrome Debugger](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome) to your VSCode instance.

Run `yarn start` in your terminal, set your breakpoints in VSCode and press `F5` to start debugging.