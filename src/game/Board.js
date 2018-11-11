import React from 'react';
import { Button, Container, Grid } from 'semantic-ui-react';
import { ToastContainer, toast } from 'react-toastify';
import { CellSize, Colors } from './constants';
import Cell from './cell';
import GameCell from './GameCell';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: props.height * CellSize,
      width: props.width * CellSize,
      // remove? does not change for player. need for player 1 and 2 sep.
      currentCellX: 0,
      currentCellY: 0,
      currentColor: null,
      nextMoveHex: '',
    };
  }

  componentDidMount() {
    this.startGame(this.props.width, this.props.height);
  }

  randomColor = () => {
    const randColor = Colors[Math.floor(Math.random() * Colors.length)];
    return randColor;
  };

  startGame = (width, height) => {
    this.cells = [];
    this.generateGrid(width, height);
  };

  generateGrid = (width, height) => {
    for (let yIdx = 0; yIdx <= height; yIdx++) {
      for (let xIdx = 0; xIdx <= width; xIdx++) {
        if (typeof this.cells[yIdx] === 'undefined') {
          this.cells[yIdx] = [];
        }
        const color = this.randomColor();
        if (yIdx === 0 && xIdx === 0) {
          this.setState({ currentColor: color });
        }
        const newCell = new GameCell(
          color,
          xIdx,
          yIdx,
          yIdx === 0 && xIdx === 0 ? 'p1' : ''
        );
        this.cells[yIdx][xIdx] = newCell;
      }
    }
  };

  findBestMoveHex = (excludeColors) => {
    const colorCounts = [];
    Colors.filter(c => excludeColors.findIndex(ec => ec.hex === c.hex) < 0).forEach(col => {
      const colChanges = [];
      const alreadyOwned = [];
      // fill already owned first
      for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
        for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
          if (this.cells[yIdx][xIdx].isOwnedBy('p1')) {
            alreadyOwned.push({ x: xIdx, y: yIdx });
          }
        }
      }
      // find new cells to acquire
      for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
        for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
          if (this.cellIsConnectedNeighbor(xIdx, yIdx, col, [...alreadyOwned, ...colChanges])) {
            colChanges.push({ x: xIdx, y: yIdx });
          }
        }
      }
      colorCounts.push({
        color: col.hex,
        changes: colChanges.length,
      });
    });
    const bestMove = colorCounts.reduce((prev, current) => {
      return prev.changes > current.changes ? prev : current;
    });
    return bestMove ? bestMove.color : '';
  };

  changeColor = newColor => {
    const coordinatesToChange = [];
    let countNewAcquired = 0;
    if (this.state.currentColor.hex !== newColor.hex) {
      // get all connected cells with old color and change to new
      for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
        for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
          const cell = this.cells[yIdx][xIdx];
          // first, always change
          if (yIdx === 0 && xIdx === 0) {
            coordinatesToChange.push({ x: xIdx, y: yIdx });
            continue;
          }
          // always change already owned
          if (cell.owner.length > 0) {
            coordinatesToChange.push({ x: xIdx, y: yIdx });
            continue;
          }
          // if connected neighbor with new color exists
          if (
            this.cellIsConnectedNeighbor(
              xIdx,
              yIdx,
              newColor,
              coordinatesToChange
            )
          ) {
            countNewAcquired++;
            coordinatesToChange.push({ x: xIdx, y: yIdx });
            continue;
          }
        }
      }
      for (const coord of coordinatesToChange) {
        const cell = this.cells[coord.y][coord.x];
        cell.color = newColor;
        cell.owner = 'p1';
      }
      this.notifyChangedCells(countNewAcquired);
      const nmh = this.findBestMoveHex([newColor]);
      this.setState({
        currentColor: newColor,
        nextMoveHex: nmh,
      });
    }
  };

  cellIsConnectedNeighbor = (x, y, newColor, changes) => {
    const theCell = this.cells[y][x];
    if (theCell.color.hex !== newColor.hex) {
      return false;
    }
    // check left neighbor within boundaries
    if (x - 1 >= 0) {
      const checkY = y;
      const checkX = x - 1;
      const checkCell = this.cells[checkY][checkX];
      // console.log(`N-LEFT: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy('p1') ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        // console.log(`N-LEFT: ${theCell.displayName()}`);
        return true;
      }
    }
    // check right neighbor within boundaries
    if (x + 1 <= this.props.width) {
      const checkY = y;
      const checkX = x + 1;
      const checkCell = this.cells[checkY][checkX];
      // console.log(`N-RIGHT: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy('p1') ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        // console.log(`N-RIGHT: ${theCell.displayName()}`)
        return true;
      }
    }
    // check top neighbor within boundaries
    if (y - 1 >= 0) {
      const checkY = y - 1;
      const checkX = x;
      const checkCell = this.cells[checkY][checkX];
      // console.log(`N-TOP: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy('p1') ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        // console.log(`N-TOP: ${theCell.displayName()}`)
        return true;
      }
    }
    // check bottom neighbor within boundaries
    if (y + 1 <= this.props.height) {
      const checkY = y + 1;
      const checkX = x;
      const checkCell = this.cells[checkY][checkX];
      // console.log(`N-BOTTOM: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy('p1') ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        // console.log(`N-BOTTOM: ${theCell.displayName()}`)
        return true;
      }
    }
    return false;
  };

  notifyChangedCells = noOfCells =>
    toast.info(`${noOfCells} !`, {
      position: 'bottom-center',
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

  renderGrid = () => {
    const rows = [];
    if (!this.cells || this.cells.length === 0) {
      return rows;
    }
    for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
      const columns = [];
      for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
        const cell = this.cells[yIdx][xIdx];
        columns.push(
          <td key={`x_${xIdx}`}>
            <Cell
              {...this.props}
              cell={cell}
              curX={this.state.currentCellX}
              curY={this.state.currentCellY}
            />
          </td>
        );
      }
      rows.push(<tr key={`y_${yIdx}`}>{columns}</tr>);
    }
    return rows;
  };

  render() {
    return (
      <Container centered>
        <Grid centered columns={3} verticalAlign="middle">
          <Grid.Row verticalAlign="middle">
            <Grid.Column>
              <Grid centered verticalAlign="middle">
                <div className="board">
                  <table>
                    <tbody>{this.renderGrid()}</tbody>
                  </table>
                </div>
              </Grid>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row centered columns={Colors.length + 8}>
            {Colors.map(col => (
              <Grid.Column key={col.name}>
                <Button
                  style={{
                    backgroundColor:
                      this.state.currentColor &&
                      this.state.currentColor.hex === col.hex
                        ? 'grey'
                        : col.hex,
                    border:
                      this.state.nextMoveHex &&
                      this.state.nextMoveHex === col.hex
                        ? '3px solid #785807'
                        : 'none',
                  }}
                  onClick={() => this.changeColor(col)}
                  diabled={
                    this.state.currentColor &&
                    this.state.currentColor.hex === col.hex
                  }>
                  &nbsp;
                </Button>
              </Grid.Column>
            ))}
          </Grid.Row>
        </Grid>
        <ToastContainer
          position="bottom-center"
          autoClose={1000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnVisibilityChange
          draggable
          pauseOnHover
        />
      </Container>
    );
  }
}
