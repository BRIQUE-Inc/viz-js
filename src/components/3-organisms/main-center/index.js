import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import * as d3 from 'd3';

/* ===== Constants ===== */
const MARGIN = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 80,
};

/* ===== Helpers ===== */
const _makeScaleX = (domain, width) =>
  d3
    .scaleLinear()
    .domain(domain)
    .range([0, width]);

const _makeScaleY = (domain, height) =>
  d3
    .scaleLinear()
    .domain(domain.slice().reverse())
    .range([0, height]);

/* ===== State handlers ===== */
const _setSize = (
  outerWidth,
  outerHeight,
  innerWidth,
  innerHeight,
) => prevState => ({
  ...prevState,
  outerWidth,
  outerHeight,
  innerWidth,
  innerHeight,
});

const _setMouseDownPos = (x, y) => prevState => ({
  ...prevState,
  mouseDownX: x,
  mouseDownY: y,
});

const _setMouseMovePos = (x, y) => prevState => ({
  ...prevState,
  mouseMoveX: x,
  mouseMoveY: y,
});

const _zoomStart = prevState => ({
  ...prevState,
  zooming: true,
});

const _zoomEnd = prevState => ({
  ...prevState,
  zooming: false,
});

const _zoom = prevState => {
  const {
    innerWidth,
    innerHeight,

    zooming,
    zoomStack,

    panningX,
    panningY,

    mouseDownX,
    mouseDownY,
    mouseMoveX,
    mouseMoveY,
  } = prevState;

  if (!zooming) return prevState;

  const mouseRectWidth = Math.abs(mouseDownX - mouseMoveX);
  const mouseRectHeight = Math.abs(mouseDownY - mouseMoveY);

  if (mouseRectWidth < 4 || mouseRectHeight < 4) return prevState;

  // zoom out
  if (mouseMoveX < mouseDownX) {
    return {
      ...prevState,
      zoomStack: zoomStack.length === 1 ? zoomStack : _.rest(zoomStack),
      panningX: 0,
      panningY: 0,
    };
  }

  const { tx: tx1, ty: ty1, sx: sx1, sy: sy1 } = _.first(zoomStack);

  const tx2 = panningX - mouseDownX;
  const ty2 = panningY - mouseDownY;
  const sx2 = innerWidth / mouseRectWidth;
  const sy2 = innerHeight / mouseRectHeight;

  const tx = (tx1 + tx2) * sx2;
  const ty = (ty1 + ty2) * sy2;
  const sx = sx1 * sx2;
  const sy = sy1 * sy2;

  return {
    ...prevState,
    zoomStack: [{ tx, ty, sx, sy }, ...zoomStack],
    panningX: 0,
    panningY: 0,
  };
};

const _zoomReset = prevState => ({
  ...prevState,
  zooming: false,
  zoomStack: [{ tx: 0, ty: 0, sx: 1, sy: 1 }],
});

const _panStart = prevState => ({
  ...prevState,
  panning: true,
});

const _panEnd = prevState => ({
  ...prevState,
  panning: false,
});

const _pan = prevState => {
  const {
    panning,
    panningX,
    panningY,
    mouseDownX,
    mouseDownY,
    mouseMoveX,
    mouseMoveY,
  } = prevState;

  if (!panning) return prevState;

  const deltaX = mouseMoveX - mouseDownX;
  const deltaY = mouseMoveY - mouseDownY;

  return {
    ...prevState,
    panningX: panningX + deltaX,
    panningY: panningY + deltaY,
  };
};

const _panReset = prevState => ({
  ...prevState,
  panning: false,
  panningX: 0,
  panningY: 0,
});

/* ===== Main component ===== */
class MainCenter extends Component {
  // Life cycle methods
  constructor(props) {
    super(props);
    this.state = {
      outerWidth: 200,
      outerHeight: 200,
      innerWidth: 100,
      innerHeight: 100,

      zooming: false,
      zoomStack: [{ tx: 0, ty: 0, sx: 1, sy: 1 }],

      panning: false,
      panningX: 0,
      panningY: 0,

      mouseDownX: 0,
      mouseDownY: 0,
      mouseMoveX: 0,
      mouseMoveY: 0,
    };

    this._container = React.createRef();
    this._canvasLower = React.createRef();
    window.chart = this._canvasLower;
    this._canvasUpper = React.createRef();

    this._onMouseDownSvg = this._onMouseDownSvg.bind(this);
    this._onMouseUpSvg = this._onMouseUpSvg.bind(this);
    this._onMouseMoveSvg = this._onMouseMoveSvg.bind(this);

    this._setCanvasSize = this._setCanvasSize.bind(this);
    this._drawLine = this._drawLine.bind(this);
    this._reset = this._reset.bind(this);
  }

  render() {
    const {
      _container,
      _canvasLower,
      _canvasUpper,

      _onMouseDownSvg,
      _onMouseUpSvg,
      _onMouseMoveSvg,

      props: { domainX, domainY, allSeriesIds },

      state: {
        innerWidth,
        innerHeight,

        zooming,
        zoomStack,

        panning,
        panningX,
        panningY,

        mouseDownX,
        mouseDownY,
        mouseMoveX,
        mouseMoveY,
      },
    } = this;

    const isPlotting = allSeriesIds.length;

    const scaleX = _makeScaleX(domainX, innerWidth);
    const scaleY = _makeScaleY(domainY, innerHeight);

    const { tx, ty, sx, sy } = _.first(zoomStack);

    const rangeStartX = panning
      ? (0 - tx - panningX - mouseMoveX + mouseDownX) / sx
      : (0 - tx - panningX) / sx;
    const rangeStartY = panning
      ? (innerHeight - ty - panningY - mouseMoveY + mouseDownY) / sy
      : (innerHeight - ty - panningY) / sy;
    const rangeEndX = panning
      ? (innerWidth - tx - panningX - mouseMoveX + mouseDownX) / sx
      : (innerWidth - tx - panningX) / sx;
    const rangeEndY = panning
      ? (0 - ty - panningY - mouseMoveY + mouseDownY) / sy
      : (0 - ty - panningY) / sy;

    const domainStartX = scaleX.invert(rangeStartX);
    const domainStartY = scaleY.invert(rangeStartY);
    const domainEndX = scaleX.invert(rangeEndX);
    const domainEndY = scaleY.invert(rangeEndY);

    // x-ticks
    const domainLenX = Math.abs(domainStartX - domainEndX);
    const domainDeltaX = domainLenX / 10;
    const domainTicksX = _.map(
      _.range(1, 10),
      v => domainStartX + v * domainDeltaX,
    );
    const rangeTicksX = _.map(domainTicksX, v => ({
      value: scaleX(v),
      label: v,
    }));
    const ticksX = _.map(rangeTicksX, ({ value, label }) => ({
      value: panning
        ? value * sx + tx + panningX + mouseMoveX - mouseDownX
        : value * sx + tx + panningX,
      label: label.toFixed(1),
    }));

    // y-ticks
    const domainLenY = Math.abs(domainStartY - domainEndY);
    const domainDeltaY = domainLenY / 8;
    const domainTicksY = _.map(
      _.range(1, 8),
      v => domainStartY + v * domainDeltaY,
    );
    const rangeTicksY = _.map(domainTicksY, v => ({
      value: scaleY(v),
      label: v,
    }));
    const ticksY = _.map(rangeTicksY, ({ value, label }) => ({
      value: panning
        ? value * sy + ty + panningY + mouseMoveY - mouseDownY
        : value * sy + ty + panningY,
      label: label.toFixed(1),
    }));

    const zoomRectX = _.min([mouseDownX, mouseMoveX]);
    const zoomRectY = _.min([mouseDownY, mouseMoveY]);
    const zoomRectWidth = Math.abs(mouseDownX - mouseMoveX);
    const zoomRectHeight = Math.abs(mouseDownY - mouseMoveY);

    return (
      <div
        ref={_container}
        style={{
          width: 0,
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={_canvasLower}
          width={innerWidth}
          height={innerHeight}
          style={{
            position: 'absolute',
            left: `${MARGIN.left}px`,
            top: `${MARGIN.top}px`,
          }}
        />
        <canvas
          ref={_canvasUpper}
          width={innerWidth}
          height={innerHeight}
          style={{
            position: 'absolute',
            left: `${MARGIN.left}px`,
            top: `${MARGIN.top}px`,
          }}
        />
        <svg
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          onMouseDown={_onMouseDownSvg}
          onMouseUp={_onMouseUpSvg}
          onMouseMove={_onMouseMoveSvg}
        >
          <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
            <g
              className="axis xAxis"
              transform={`translate(0, ${innerHeight + 1})`}
            >
              <path
                d={`M 0 0 L ${innerWidth} 0`}
                stroke="black"
                strokeWidth="2"
              />
              {isPlotting &&
                _.map(ticksX, ({ value, label }, idx) => (
                  <g
                    key={idx}
                    className="tick xTick"
                    transform={`translate(${value}, 0)`}
                  >
                    <path d="M 0 0 L 0 6" stroke="black" strokeWidth="1" />
                    <text
                      textAnchor="middle"
                      alignmentBaseline="hanging"
                      transform="translate(0, 8)"
                      style={{ userSelect: 'none' }}
                    >
                      {label}
                    </text>
                  </g>
                ))}
            </g>
            <g className="axis yAxis" transform={'translate(-1, 0)'}>
              <path
                d={`M 0 0 L 0 ${innerHeight + 2}`}
                stroke="black"
                strokeWidth="2"
              />
              {isPlotting &&
                _.map(ticksY, ({ value, label }, idx) => (
                  <g
                    key={idx}
                    className="tick yTick"
                    transform={`translate(0, ${value})`}
                  >
                    <path d="M 0 0 L -6 0" stroke="black" strokeWidth="1" />
                    <text
                      textAnchor="end"
                      alignmentBaseline="middle"
                      transform="translate(-8, 0)"
                      style={{ userSelect: 'none' }}
                    >
                      {label}
                    </text>
                  </g>
                ))}
            </g>
            {zooming && (
              <rect
                transform={`translate(${zoomRectX}, ${zoomRectY})`}
                width={zoomRectWidth}
                height={zoomRectHeight}
                stroke="black"
                strokeWidth="1"
                strokeDasharray="4 4"
                fill="none"
              />
            )}
          </g>
        </svg>
      </div>
    );
  }

  componentDidMount() {
    const { _setCanvasSize } = this;
    _setCanvasSize();
    window.addEventListener('resize', _setCanvasSize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.seriesById !== this.props.seriesById) {
      return this._reset();
    }
    this._drawLine();
  }

  componentWillUnmount() {
    const { _setCanvasSize } = this;
    window.removeEventListener('resize', _setCanvasSize);
  }

  // Event handlers
  _onMouseDownSvg(event) {
    const {
      state: { innerWidth, innerHeight },
    } = this;
    const { clientX, clientY, currentTarget } = event;
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left - MARGIN.left;
    const y = clientY - rect.top - MARGIN.top;

    // panning
    if (event.ctrlKey)
      return this.setState(
        _.compose(
          _panStart,
          _setMouseDownPos(x, y),
        ),
      );

    // zooming && out of bound
    if (x < 0 || x > innerWidth || y < 0 || y > innerHeight)
      return this.setState(_setMouseDownPos(x, y));

    // zooming
    this.setState(
      _.compose(
        _zoomStart,
        _setMouseDownPos(x, y),
      ),
    );
  }

  _onMouseUpSvg() {
    this.setState(
      _.compose(
        _panEnd,
        _zoomEnd,
        _pan,
        _zoom,
      ),
    );
  }

  _onMouseMoveSvg(event) {
    const { _drawLine } = this;
    const { clientX, clientY, currentTarget } = event;
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left - MARGIN.left;
    const y = clientY - rect.top - MARGIN.top;
    this.setState(_setMouseMovePos(x, y), event.ctrlKey ? _drawLine : _.noop);
  }

  // Other methods
  _setCanvasSize() {
    const { _container, _drawLine } = this;
    const { clientWidth, clientHeight } = _container.current;
    const innerWidth = clientWidth - MARGIN.left - MARGIN.right;
    const innerHeight = clientHeight - MARGIN.top - MARGIN.bottom;
    this.setState(
      _setSize(clientWidth, clientHeight, innerWidth, innerHeight),
      _drawLine,
    );
  }

  _drawLine() {
    const {
      _canvasLower,
      props: { seriesById, allSeriesIds, domainX, domainY },
      state: {
        innerWidth,
        innerHeight,

        mouseDownX,
        mouseDownY,
        mouseMoveX,
        mouseMoveY,

        zoomStack,

        panning,
        panningX,
        panningY,
      },
    } = this;

    if (!allSeriesIds.length) return;

    const { tx, ty, sx, sy } = _.first(zoomStack);

    const ctx = _canvasLower.current.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(
      0,
      0,
      _canvasLower.current.width,
      _canvasLower.current.height,
    );
    ctx.setTransform(
      sx,
      0,
      0,
      sy,
      panning ? tx + panningX + mouseMoveX - mouseDownX : tx + panningX,
      panning ? ty + panningY + mouseMoveY - mouseDownY : ty + panningY,
    );

    const scaleX = _makeScaleX(domainX, innerWidth);
    const scaleY = _makeScaleY(domainY, innerHeight);
    const scaleColor = d3.scaleOrdinal(d3.schemeCategory10);

    const len = allSeriesIds.length;
    for (let i = 0; i < len; i++) {
      const id = allSeriesIds[i];
      const series = seriesById[id];
      const len = series.length;
      if (len <= 1) continue;
      ctx.beginPath();
      ctx.moveTo(scaleX(series[0].x), scaleY(series[0].y));
      for (let j = 1; j < len; j++) {
        ctx.lineTo(scaleX(series[j].x), scaleY(series[j].y));
      }
      const color = scaleColor(i);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 / _.max([sx, sy]);
      ctx.stroke();
    }
  }

  _reset() {
    const { _canvasLower, _canvasUpper, _drawLine } = this;

    const ctxLower = _canvasLower.current.getContext('2d');
    const ctxUpper = _canvasUpper.current.getContext('2d');

    ctxLower.setTransform(1, 0, 0, 1, 0, 0);
    ctxUpper.setTransform(1, 0, 0, 1, 0, 0);

    ctxLower.clearRect(
      0,
      0,
      _canvasLower.current.width,
      _canvasLower.current.height,
    );
    ctxUpper.clearRect(
      0,
      0,
      _canvasUpper.current.width,
      _canvasUpper.current.height,
    );

    this.setState(
      _.compose(
        _panReset,
        _zoomReset,
      ),
      _drawLine,
    );
  }
}

MainCenter.defaultProps = {
  seriesById: {},
  allSeriesIds: [],
  domainX: [0, 0],
  domainY: [0, 0],
};

MainCenter.propTypes = {
  seriesById: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
    ),
  ),
  allSeriesIds: PropTypes.arrayOf(PropTypes.string),
  domainX: PropTypes.arrayOf(PropTypes.number),
  domainY: PropTypes.arrayOf(PropTypes.number),
};

export default MainCenter;
