import React, { Component } from 'react';
import _ from 'underscore';
import MainCenter from '../../3-organisms/main-center';
import MainHeader from '../../3-organisms/main-header';
import MainLeft from '../../3-organisms/main-left';
import MainRight from '../../3-organisms/main-right';

/* ===== State handlers ===== */
const _setSeries = seriesById => prevState => ({
  ...prevState,
  seriesById,
  allSeriesIds: _.keys(seriesById),
});

const _setDomainX = domainX => prevState => ({
  ...prevState,
  domainX,
});

/* ===== Main component ===== */
class MainPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seriesById: {},
      allSeriesIds: [],
      domainX: [],
      domainY: [0, 100],
    };
    this._onChangeSetting = this._onChangeSetting.bind(this);
  }

  render() {
    const {
      _onChangeSetting,
      state: { seriesById, allSeriesIds, domainX, domainY },
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
          <MainCenter
            seriesById={seriesById}
            allSeriesIds={allSeriesIds}
            domainX={domainX}
            domainY={domainY}
          />
          <MainRight />
        </div>
      </div>
    );
  }

  _onChangeSetting(seriesNum, pointsNum) {
    const {
      state: { domainY },
    } = this;
    const seriesById = _.reduce(
      _.range(seriesNum),
      (seriesById, id) => {
        seriesById[id] = _.map(_.range(pointsNum), x => ({
          x,
          y: _.random(...domainY),
        }));
        return seriesById;
      },
      {},
    );
    this.setState(
      _.compose(
        _setSeries(seriesById),
        _setDomainX([0, pointsNum - 1]),
      ),
    );
  }
}

export default MainPage;
