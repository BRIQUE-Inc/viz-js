import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import * as d3 from 'd3';
import {
  makeLinearScaleX,
  makeLinearScaleY,
  transformCanvas,
  clearCanvasByContext,
  clearCanvas,
  transformCoordX,
  transformCoordY,
  inverseCoord,
  concatTransform,
  drawLineInCanvas,
} from '../../../assets/js/viz';

/* ===== Constants ===== */
const MARGIN = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 80,
};

const _makeRandomColor = d3.scaleOrdinal(d3.schemeCategory10);

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

  const sx2 = innerWidth/ mouseRectWidth;
  const sy2 = innerHeight / mouseRectHeight;

  const [tx, ty, sx, sy] = concatTransform(
    tx1,
    ty1,
    sx1,
    sy1,
    tx2 * sx2,
    ty2 * sy2,
    sx2,
    sy2,
  );

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

    const scaleX = makeLinearScaleX(domainX, innerWidth);
    const scaleY = makeLinearScaleY(domainY, innerHeight);

    const { tx: _tx, ty: _ty, sx, sy } = _.first(zoomStack);
    const tx = panning
      ? _tx + panningX + mouseMoveX - mouseDownX
      : _tx + panningX;
    const ty = panning
      ? _ty + panningY + mouseMoveY - mouseDownY
      : _ty + panningY;

    const [rangeStartX, rangeStartY] = inverseCoord(
      tx,
      ty,
      sx,
      sy,
      0,
      innerHeight,
    );
    const [rangeEndX, rangeEndY] = inverseCoord(tx, ty, sx, sy, innerWidth, 0);

    const domainStartX = scaleX.invert(rangeStartX);
    const domainStartY = scaleY.invert(rangeStartY);
    const domainEndX = scaleX.invert(rangeEndX);
    const domainEndY = scaleY.invert(rangeEndY);

    // x-ticks
    const domainDeltaX = Math.abs(domainStartX - domainEndX) / 10;
    const ticksX = _.map(_.range(1, 10), v => {
      const domainTickX = domainStartX + v * domainDeltaX;
      return {
        value: transformCoordX(tx, sx, scaleX(domainTickX)),
        label: domainTickX.toFixed(1),
      };
    });

    // y-ticks
    const domainDeltaY = Math.abs(domainStartY - domainEndY) / 8;
    const ticksY = _.map(_.range(1, 8), v => {
      const domainTickY = domainStartY + v * domainDeltaY;
      return {
        value: transformCoordY(ty, sy, scaleY(domainTickY)),
        label: domainTickY.toFixed(1),
      };
    });

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
    const { _reset, _drawLine, props } = this;
    prevProps.seriesById !== props.seriesById ? _reset() : _drawLine();
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
    clearCanvasByContext(ctx);
    transformCanvas(
      ctx,
      tx + panningX + (panning ? mouseMoveX - mouseDownX : 0),
      ty + panningY + (panning ? mouseMoveY - mouseDownY : 0),
      sx,
      sy,
    );

    const len = allSeriesIds.length;
    for (let i = 0; i < len; i++) {
      const color = _makeRandomColor(i);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1 / _.max([sx, sy]);

      const id = allSeriesIds[i];
      const series = seriesById[id];

      drawLineInCanvas(
        ctx,
        series,
        makeLinearScaleX(domainX, innerWidth),
        makeLinearScaleY(domainY, innerHeight),
      );
    }
  }

  _reset() {
    const { _canvasLower, _canvasUpper, _drawLine } = this;

    clearCanvas(_canvasLower.current);
    clearCanvas(_canvasUpper.current);

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
