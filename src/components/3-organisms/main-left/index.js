import React, { Component } from 'react';
import PropTypes from 'prop-types';

const _setSeriesNum = num => prevState => ({
  ...prevState,
  seriesNum: num,
});

const _setPointsNum = num => prevState => ({
  ...prevState,
  pointsNum: num,
});

class MainLeft extends Component {
  constructor(props) {
    super(props);
    this.state = {
      seriesNum: '1',
      pointsNum: '10000',
    };
    this._onChangeSeriesNum = this._onChangeSeriesNum.bind(this);
    this._onChangePointsNum = this._onChangePointsNum.bind(this);
    this._onClickGo = this._onClickGo.bind(this);
  }

  render() {
    const {
      _onChangeSeriesNum,
      _onChangePointsNum,
      _onClickGo,
      state: { seriesNum, pointsNum },
    } = this;
    return (
      <div style={{ width: '10rem', display: 'flex', flexDirection: 'column' }}>
        <h2>Settings</h2>
        <label
          style={{
            height: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <span>Series num</span>
          <input type="text" value={seriesNum} onChange={_onChangeSeriesNum} />
        </label>
        <label
          style={{
            height: '50px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <span>Points num</span>
          <input type="text" value={pointsNum} onChange={_onChangePointsNum} />
        </label>
        <button style={{ marginTop: '10px' }} onClick={_onClickGo}>
          Go
        </button>
      </div>
    );
  }

  _onChangeSeriesNum(event) {
    this.setState(_setSeriesNum(event.target.value));
  }

  _onChangePointsNum(event) {
    this.setState(_setPointsNum(event.target.value));
  }

  _onClickGo() {
    const {
      props: { onChangeSetting },
      state: { seriesNum: _seriesNum, pointsNum: _pointsNum },
    } = this;
    const seriesNum = parseInt(_seriesNum, 10);
    const pointsNum = parseInt(_pointsNum, 10);
    if (isNaN(seriesNum) || isNaN(pointsNum)) return;
    onChangeSetting(seriesNum, pointsNum);
  }
}

MainLeft.defaultProps = {
  onChangeSetting: seriesNum => {},
};

MainLeft.propTypes = {
  onChangeSetting: PropTypes.func,
};

export default MainLeft;
