export default class GameCell {
  constructor(color, x, y, owner) {
    this.color = color;
    this.X = x;
    this.Y = y;
    this.owner = owner;
  }

  isCurrentCell = (curX, curY) => {
    return this.X === curX && this.Y === curY;
  };

  changeColor = newColor => {
    if (this.color.hex !== newColor.hex) {
      this.color = newColor;
    }
  };

  displayName = () => {
    return `{X:${this.X}, Y:${this.Y}, Owner: ${this.owner}, Color: ${this.color.name}}`;
  };

  isOwnedBy = possibleOwner => {
    return this.owner && this.owner === possibleOwner;
  }
}
