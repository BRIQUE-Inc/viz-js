import React, { Component } from 'react';
import _ from 'underscore';
import MainCenter from '../../3-organisms/main-center';
import MainHeader from '../../3-organisms/main-header';
import MainLeft from '../../3-organisms/main-left';
import MainRight from '../../3-organisms/main-right';

const _setSeries = series => prevState => ({
  ...prevState,
  series,
});

class MainPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      series: [],
    };
    this._onChangeSetting = this._onChangeSetting.bind(this);
  }

  render() {
    const {
      _onChangeSetting,
      state: { series },
    } = this;
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
          <MainLeft onChangeSetting={_onChangeSetting} />
          <MainCenter series={series} />
          <MainRight />
        </div>
      </div>
    );
  }

  _onChangeSetting(seriesNum, pointsNum) {
    const series = _.map(_.range(seriesNum), () =>
      _.map(_.range(pointsNum), () => _.random(0, 100)),
    );
    this.setState(_setSeries(series));
  }
}

export default MainPage;
