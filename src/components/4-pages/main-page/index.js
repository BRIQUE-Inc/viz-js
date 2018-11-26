import React, { Component } from 'react';
import MainCenter from '../../3-organisms/main-center';
import MainHeader from '../../3-organisms/main-header';
import MainLeft from '../../3-organisms/main-left';
import MainRight from '../../3-organisms/main-right';

class MainPage extends Component {
  render() {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MainHeader />
        <div style={{ height: 0, flexGrow: 1, display: 'flex' }}>
          <MainLeft />
          <MainCenter />
          <MainRight />
        </div>
      </div>
    );
  }
}

export default MainPage;
