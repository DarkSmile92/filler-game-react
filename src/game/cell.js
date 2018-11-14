import React from 'react';
import { Icon } from 'semantic-ui-react';
import { CellSize, Player1, Player2 } from './constants';

export default class Cell extends React.Component {
  constructor(props) {
    super(props);
    // props: curX, curY, color {name, hex}
    this.state = {
      cell: props.cell,
      xmax: props.XMax,
      ymax: props.YMax,
    };
  }

  isStartingCell = () => {
    return this.state.cell.isCurrentCell(0, 0);
  };

  calcBorderSize = () => {
    if (
      this.state.cell.isCurrentCell(0, 0) ||
      this.state.cell.isCurrentCell(this.state.xmax, this.state.ymax)
    ) {
      return '3px';
    }
    return '1px';
  };

  calcBorderColor = () => {
    if (this.state.cell.isCurrentCell(0, 0)) {
      return '#C0A3B5';
    }
    if (this.state.cell.isCurrentCell(this.state.xmax, this.state.ymax)) {
      return '#A3C0AE';
    }
    return 'grey';
  };

  render() {
    const borderSize = this.calcBorderSize();
    const borderColor = this.calcBorderColor();
    let icon = <span />;
    const iconStyle = { fontSize: '50%' };

    if (this.state.cell) {
      switch (this.state.cell.owner) {
        case Player1:
          icon = <Icon name="fly" style={iconStyle} />;
          break;
        case Player2:
          icon = <Icon name="sun" style={iconStyle} />;
          break;
      }
    }

    return (
      <div
        className="cell"
        style={{
          backgroundColor: this.state.cell.color.hex,
          height: `${CellSize}rem`,
          width: `${CellSize}rem`,
          border: `${borderSize} groove ${borderColor}`,
          textAlign: 'center',
          display: 'flex',
        }}>
        {this.props.ownerDisplay && icon}
      </div>
    );
  }
}
