import React, { Component } from 'react';

const MARGIN = {
  top: 14,
  right: 20,
  bottom: 14,
  left: 20,
};

const _setSize = (width, height) => prevState => ({
  ...prevState,
  width,
  height,
});

class MainCenter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 100,
      height: 100,
    };
    this._container = React.createRef();
    this._canvasLower = React.createRef();
    this._canvasUpper = React.createRef();
    this._setCanvasSize = this._setCanvasSize.bind(this);
  }

  render() {
    const {
      _container,
      _canvasLower,
      _canvasUpper,
      state: { width, height },
    } = this;
    return (
      <div
        ref={_container}
        style={{ width: 0, flexGrow: 1, position: 'relative' }}
      >
        <svg style={{ position: 'absolute', width: '100%', height: '100%' }} />
        <canvas
          ref={_canvasLower}
          width={width - MARGIN.left - MARGIN.right}
          height={height - MARGIN.top - MARGIN.bottom}
          style={{
            position: 'absolute',
            left: `${MARGIN.left}px`,
            top: `${MARGIN.top}px`,
          }}
        />
        <canvas
          ref={_canvasUpper}
          width={width - MARGIN.left - MARGIN.right}
          height={height - MARGIN.top - MARGIN.bottom}
          style={{
            position: 'absolute',
            left: `${MARGIN.left}px`,
            top: `${MARGIN.top}px`,
          }}
        />
      </div>
    );
  }

  componentDidMount() {
    const { _setCanvasSize } = this;
    _setCanvasSize();
  }

  _setCanvasSize(f = () => {}) {
    const { _container } = this;
    const { clientWidth, clientHeight } = _container.current;
    const width = clientWidth - MARGIN.left - MARGIN.right;
    const height = clientHeight - MARGIN.top - MARGIN.bottom;
    this.setState(_setSize(width, height), f);
  }
}

export default MainCenter;
