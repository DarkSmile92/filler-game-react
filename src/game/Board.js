import React from 'react';
import {
  Button,
  Container,
  Checkbox,
  Icon,
  Grid,
  Statistic,
  Segment,
} from 'semantic-ui-react';
import { ToastContainer, toast } from 'react-toastify';
import { CellSize, Colors, Player1, Player2 } from './constants';
import Cell from './cell';
import GameCell from './GameCell';
import { codeBlock } from 'common-tags';

const buildStat = pct => (
  <Statistic horizontal inverted size="mini">
    <Statistic.Value>{pct.toFixed(2)}</Statistic.Value>
    <Statistic.Label>%</Statistic.Label>
  </Statistic>
);

const calcPct = (partial, total) => (partial * 100) / total;

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      height: props.height * CellSize,
      width: props.width * CellSize,
      currentColorP1: { name: 'empty', hex: '0' },
      currentColorP2: { name: 'empty', hex: '0' },
      currentPlayer: Player1,
      completeP1: 0,
      completeP2: 0,
      nextMove: { hex: '0', cnt: 0 },
      won: false,
      wonName: '',
      displayOwner: false,
      displayPoss: false,
      debug: false,
    };
  }

  componentDidMount() {
    this.startGame(this.props.width, this.props.height);
  }

  randomColor = () => {
    const randColor = Colors[Math.floor(Math.random() * Colors.length)];
    return randColor;
  };

  reset = (width, height) => {
    const emptyCol = { name: 'empty', hex: '0' };
    this.setState({
      cells: [],
      currentColorP1: emptyCol,
      currentColorP2: emptyCol,
      currentPlayer: Player1,
      completeP1: 0,
      completeP2: 0,
      nextMove: { hex: '0', cnt: 0 },
      won: false,
      wonName: '',
    }, () => this.generateGrid(width, height));
  };

  startGame = (width, height) => {
    this.reset(width, height);
  };

  generateGrid = (width, height) => {
    for (let yIdx = 0; yIdx <= height; yIdx++) {
      for (let xIdx = 0; xIdx <= width; xIdx++) {
        if (typeof this.state.cells[yIdx] === 'undefined') {
          this.state.cells[yIdx] = [];
        }
        const color = this.randomColor();
        if (yIdx === 0 && xIdx === 0) {
          this.setState({ currentColor: color, currentColorP1: color });
        }
        if (yIdx === height && xIdx === width) {
          while (color.hex === this.state.currentColorP1) {
            color = this.randomColor();
          }
          this.setState({ currentColorP2: color });
        }
        const newCell = new GameCell(
          color,
          xIdx,
          yIdx,
          yIdx === 0 && xIdx === 0
            ? Player1
            : yIdx === height && xIdx === width
            ? Player2
            : ''
        );
        this.state.cells[yIdx][xIdx] = newCell;
      }
    }
  };

  findBestMoveHex = (excludeColors, player) => {
    const colorCounts = [];
    Colors.filter(
      c => excludeColors.findIndex(ec => ec.hex === c.hex) < 0
    ).forEach(col => {
      const colChanges = [];
      const alreadyOwned = [];
      // fill already owned first
      for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
        for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
          if (this.state.cells[yIdx][xIdx].isOwnedBy(player)) {
            alreadyOwned.push({ x: xIdx, y: yIdx });
          }
        }
      }
      // find new cells to acquire
      // p1 == start 0, p2 == start end
      // ToDo: Improve this!
      if (player === Player1) {
        for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
          for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
            if (
              this.cellIsConnectedNeighbor(
                xIdx,
                yIdx,
                col,
                [...alreadyOwned, ...colChanges],
                player
              )
            ) {
              colChanges.push({ x: xIdx, y: yIdx });
            }
          }
        }
      } else {
        for (let yIdx = this.props.height; yIdx >= 0; yIdx--) {
          for (let xIdx = this.props.width; xIdx >= 0; xIdx--) {
            if (
              this.cellIsConnectedNeighbor(
                xIdx,
                yIdx,
                col,
                [...alreadyOwned, ...colChanges],
                player
              )
            ) {
              colChanges.push({ x: xIdx, y: yIdx });
            }
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
    return bestMove
      ? { hex: bestMove.color, cnt: bestMove.changes }
      : { hex: '0', cnt: 0 };
  };

  updateStatsForPlayer = player => {
    let ocs = 0;
    for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
      for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
        if (this.state.cells[yIdx][xIdx].isOwnedBy(player)) {
          ocs++;
        }
      }
    }
    const pct = calcPct(ocs, this.props.height * this.props.width);

    this.setState({
      completeP1: player === Player1 ? pct : this.state.completeP1,
      completeP2: player === Player2 ? pct : this.state.completeP2,
      won: pct >= 50 ? true : false,
      wonName: pct >= 50 ? player : '',
    });
  };

  changeColor = newColor => {
    const currentPlayer = this.state.currentPlayer;

    const changes = this.findNewCells(newColor, currentPlayer, []);
    let countNewAcquired = 0;
    for (const coord of changes) {
      const cell = this.state.cells[coord.y][coord.x];
      if (!cell.isOwnedBy(currentPlayer)) {
        countNewAcquired++;
      }
      cell.color = newColor;
      cell.owner = currentPlayer;
    }
    this.updateStatsForPlayer(currentPlayer);
    this.notifyChangedCells(countNewAcquired);
    // exclude newColor and the color of the opponent
    const excludeColorsSearch = [
      newColor,
      currentPlayer === Player1
        ? this.state.currentColorP2
        : this.state.currentColorP1,
    ];
    const nmh = this.findBestMoveHex(
      excludeColorsSearch,
      currentPlayer === Player1 ? Player2 : Player1
    );
    this.setState({
      currentColorP1:
        currentPlayer === Player1 ? newColor : this.state.currentColorP1,
      currentColorP2:
        currentPlayer === Player2 ? newColor : this.state.currentColorP2,
      nextMove: nmh,
      currentPlayer: currentPlayer === Player1 ? Player2 : Player1,
    });
    // }
  };

  findNewCells = (newColor, player, alreadyFound) => {
    let foundChanges = 0;
    const currentPlayerColor =
      player === Player1
        ? this.state.currentColorP1
        : this.state.currentColorP2;

    if (!currentPlayerColor || currentPlayerColor.hex !== newColor.hex) {
      // get all connected cells with old color and change to new
      if (player === Player1) {
        for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
          for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
            const cell = this.state.cells[yIdx][xIdx];
            // base cell, always change
            if (yIdx === 0 && xIdx === 0) {
              alreadyFound.push({ x: xIdx, y: yIdx });
              continue;
            }
            // always change already owned
            if (cell.owner && cell.isOwnedBy(player)) {
              alreadyFound.push({ x: xIdx, y: yIdx });
              continue;
            }
            // if connected neighbor with new color exists
            if (
              this.cellIsConnectedNeighbor(
                xIdx,
                yIdx,
                newColor,
                alreadyFound,
                player
              )
            ) {
              if (
                alreadyFound.findIndex(af => af.x === xIdx && af.y === yIdx) < 0
              ) {
                foundChanges++;
                alreadyFound.push({ x: xIdx, y: yIdx });
              }
              continue;
            }
          }
        }
      } else {
        for (let yIdx = this.props.height; yIdx >= 0; yIdx--) {
          for (let xIdx = this.props.width; xIdx >= 0; xIdx--) {
            const cell = this.state.cells[yIdx][xIdx];
            // base cell, always change
            if (yIdx === this.props.height && xIdx === this.props.width) {
              alreadyFound.push({ x: xIdx, y: yIdx });
              continue;
            }
            // always change already owned
            if (cell.owner && cell.isOwnedBy(player)) {
              alreadyFound.push({ x: xIdx, y: yIdx });
              continue;
            }
            // if connected neighbor with new color exists
            if (
              this.cellIsConnectedNeighbor(
                xIdx,
                yIdx,
                newColor,
                alreadyFound,
                player
              )
            ) {
              if (
                alreadyFound.findIndex(af => af.x === xIdx && af.y === yIdx) < 0
              ) {
                foundChanges++;
                alreadyFound.push({ x: xIdx, y: yIdx });
              }
              continue;
            }
          }
        }
      }
    }
    if (foundChanges > 0) {
      this.findNewCells(newColor, player, alreadyFound);
    }
    return alreadyFound;
  };

  cellIsConnectedNeighbor = (x, y, newColor, changes, currentPlayer) => {
    const theCell = this.state.cells[y][x];
    if (theCell.color.hex !== newColor.hex) {
      return false;
    }
    // check left neighbor within boundaries
    if (x - 1 >= 0) {
      const checkY = y;
      const checkX = x - 1;
      const checkCell = this.state.cells[checkY][checkX];
      // console.log(`N-LEFT: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy(currentPlayer) ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        if (this.state.debug) console.log(`N-LEFT: ${theCell.displayName()}`);
        return true;
      }
    }
    // check right neighbor within boundaries
    if (x + 1 <= this.props.width) {
      const checkY = y;
      const checkX = x + 1;
      const checkCell = this.state.cells[checkY][checkX];
      // console.log(`N-RIGHT: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy(currentPlayer) ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        if (this.state.debug) console.log(`N-RIGHT: ${theCell.displayName()}`);
        return true;
      }
    }
    // check top neighbor within boundaries
    if (y - 1 >= 0) {
      const checkY = y - 1;
      const checkX = x;
      const checkCell = this.state.cells[checkY][checkX];
      // console.log(`N-TOP: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy(currentPlayer) ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        if (this.state.debug) console.log(`N-TOP: ${theCell.displayName()}`);
        return true;
      }
    }
    // check bottom neighbor within boundaries
    if (y + 1 <= this.props.height) {
      const checkY = y + 1;
      const checkX = x;
      const checkCell = this.state.cells[checkY][checkX];
      // console.log(`N-BOTTOM: Checking ${checkCell.displayName()}`);
      if (
        checkCell.isOwnedBy(currentPlayer) ||
        changes.findIndex(c => c.x === checkX && c.y === checkY) >= 0
      ) {
        if (this.state.debug) console.log(`N-BOTTOM: ${theCell.displayName()}`);
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

  renderWinnerGrid = () => {
    return (
      <div
        style={{
          width: `${CellSize * this.props.width}rem`,
          height: `${CellSize * this.props.height}rem`,
          backgroundColor: '#729CEE',
          color: '#EEC472',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <span style={{ fontSize: '3rem' }}>Winner: {this.state.wonName}</span>
      </div>
    );
  };

  renderGrid = () => {
    const rows = [];
    if (!this.state.cells || this.state.cells.length === 0) {
      return rows;
    }

    // return this.state.cells ? this.state.cells.map((yc, idx) => {
    //   return (<tr key={`y_${idx}`}>{yc.map(xc => (<td key={`x_${xc.X}`}>
    //   <Cell
    //     {...this.props}
    //     cell={xc}
    //     YMax={this.props.height}
    //     XMax={this.props.width}
    //     ownerDisplay={this.state.displayOwner}
    //   />
    // </td>)
    //     )}</tr>);
    // }) : [];

    for (let yIdx = 0; yIdx <= this.props.height; yIdx++) {
      const columns = [];
      for (let xIdx = 0; xIdx <= this.props.width; xIdx++) {
        const cell = this.state.cells[yIdx][xIdx];
        columns.push(
          <td key={`x_${xIdx}`}>
            <Cell
              {...this.props}
              cell={cell}
              YMax={this.props.height}
              XMax={this.props.width}
              ownerDisplay={this.state.displayOwner}
            />
          </td>
        );
      }
      rows.push(<tr key={`y_${yIdx}`}>{columns}</tr>);
    }
    return rows;
  };

  toggleDisplayOwner = () =>
    this.setState({ displayOwner: !this.state.displayOwner });

  toggleDisplayPoss = () =>
    this.setState({ displayPoss: !this.state.displayPoss });

  render() {
    return (
      <Container centered>
        <Grid centered columns={3} verticalAlign="middle">
          <Grid.Row verticalAlign="middle">
            <Grid.Column>
              <Grid centered verticalAlign="middle">
                {!this.state.won && (
                  <div className="board">
                    <table>
                      <tbody>{this.renderGrid()}</tbody>
                    </table>
                  </div>
                )}
                {this.state.won && this.renderWinnerGrid()}
              </Grid>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row centered columns={Colors.length + 8}>
            {Colors.map(col => (
              <Grid.Column key={col.name}>
                <Button
                  style={{
                    backgroundColor:
                      this.state.currentColorP1.hex === col.hex ||
                      this.state.currentColorP2.hex === col.hex
                        ? '#23272E'
                        : col.hex,
                    border:
                      this.state.nextMove && this.state.nextMove.hex === col.hex
                        ? '3px solid #785807'
                        : 'none',
                  }}
                  onClick={() => this.changeColor(col)}
                  diabled={
                    this.state.currentColorP1.hex === col.hex ||
                    this.state.currentColorP2.hex === col.hex ||
                    this.state.won
                  }>
                  {this.state.displayPoss && this.state.nextMove.hex === col.hex
                    ? this.state.nextMove.cnt
                    : ''}
                  &nbsp;
                </Button>
              </Grid.Column>
            ))}
          </Grid.Row>
          <Grid.Row verticalAlign="middle">
            <Grid.Column>
              <Grid relaxed>
                <Grid.Row>
                  <Grid.Column>
                    {this.state.currentPlayer === Player1 && (
                      <Icon name="chevron circle right" />
                    )}
                  </Grid.Column>
                  <Grid.Column>{Player1}</Grid.Column>
                  <Grid.Column>{buildStat(this.state.completeP1)}</Grid.Column>
                </Grid.Row>
                <Grid.Row>
                  <Grid.Column>
                    {this.state.currentPlayer === Player2 && (
                      <Icon name="chevron circle right" />
                    )}
                  </Grid.Column>
                  <Grid.Column>{Player2}</Grid.Column>
                  <Grid.Column>{buildStat(this.state.completeP2)}</Grid.Column>
                </Grid.Row>
              </Grid>
            </Grid.Column>
            <Grid.Column>
              <Segment>
                <Checkbox
                  label={'Display owner'}
                  toggle
                  onChange={this.toggleDisplayOwner}
                />
                <Checkbox
                  label={'Display possibilities'}
                  toggle
                  onChange={this.toggleDisplayPoss}
                />
              </Segment>
            </Grid.Column>
            <Grid.Column>
              <Button
                onClick={() =>
                  this.startGame(this.props.width, this.props.height)
                }>
                New Game
              </Button>
            </Grid.Column>
          </Grid.Row>
          {/* <Grid.Row verticalAlign="middle">
            <Grid.Column>
              
            </Grid.Column>
          </Grid.Row> */}
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
