import React from 'react';
import { CellSize } from './constants';
import GameCell from './GameCell';

export default class Cell extends React.Component {
  constructor(props) {
    super(props);
    // props: curX, curY, color {name, hex}
    this.state = {
      cell: props.cell,
    };
  }

  isStartingCell = () => {
    return this.state.cell.isCurrentCell(0, 0);
  };

  render() {
    const borderSize = this.isStartingCell() ? '3px' : '1px';
    const borderColor = this.isStartingCell() ? '#C0A3B5' : 'grey';

    return (
      <div
        className="cell"
        style={{
          backgroundColor: this.state.cell.color.hex,
          height: `${CellSize}rem`,
          width: `${CellSize}rem`,
          border: `${borderSize} groove ${borderColor}`,
        }}
      />
    );
  }
}
