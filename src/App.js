import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
import Board from './game/Board';
import { Button, Container, Grid, Header } from 'semantic-ui-react';
import { Colors } from './game/constants';

class App extends Component {
  render() {
    return (
      <div className='App-header' style={{minHeight: '100vh'}}>
      <Header as='h2' inverted>Filler by Robin</Header>
      <Board height={20} width={20} />
      </div>
    );
  }
}

export default App;
