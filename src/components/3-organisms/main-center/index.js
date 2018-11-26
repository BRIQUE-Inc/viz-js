import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import * as d3 from 'd3';

const MARGIN = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

const _makeXScale = (domain, width) =>
  d3
    .scaleLinear()
    .domain(domain)
    .range([0, width]);

const _makeYScale = (domain, height) =>
  d3
    .scaleLinear()
    .domain(domain.slice().reverse())
    .range([0, height]);

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

class MainCenter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      outerWidth: 200,
      outerHeight: 200,
      innerWidth: 100,
      innerHeight: 100,
    };
    this._container = React.createRef();
    this._canvasLower = React.createRef();
    this._canvasUpper = React.createRef();
    this._setCanvasSize = this._setCanvasSize.bind(this);
    this._drawLine = this._drawLine.bind(this);
  }

  render() {
    const {
      _container,
      _canvasLower,
      _canvasUpper,
      props: { xDomain, yDomain },
      state: { innerWidth, innerHeight },
    } = this;

    const xScale = _makeXScale(xDomain, innerWidth);
    const yScale = _makeYScale(yDomain, innerHeight);

    const xDomainLen = Math.abs(xDomain[0] - xDomain[1]);
    const yDomainLen = Math.abs(yDomain[0] - yDomain[1]);

    const xDelta = xDomainLen / 10;
    const yDelta = yDomainLen / 8;

    const xDomainTicks = _.map(_.range(1, 10), v => Math.floor(v * xDelta));
    const yDomainTicks = _.map(_.range(1, 8), v => Math.floor(v * yDelta));

    const xTicks = _.map(xDomainTicks, v => ({ value: xScale(v), label: v }));
    const yTicks = _.map(yDomainTicks, v => ({ value: yScale(v), label: v }));

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
        <svg style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <g
            className="axis xAxis"
            transform={`translate(${MARGIN.left}, ${innerHeight +
              MARGIN.top +
              1})`}
          >
            <path
              d={`M 0 0 L ${innerWidth} 0`}
              stroke="black"
              strokeWidth="2"
            />
            {_.map(xTicks, ({ value, label }, idx) => (
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
                >
                  {label}
                </text>
              </g>
            ))}
          </g>
          <g
            className="axis yAxis"
            transform={`translate(${MARGIN.left - 1}, ${MARGIN.top})`}
          >
            <path
              d={`M 0 0 L 0 ${innerHeight + 2}`}
              stroke="black"
              strokeWidth="2"
            />
            {_.map(yTicks, ({ value, label }, idx) => (
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
                >
                  {label}
                </text>
              </g>
            ))}
          </g>
        </svg>
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
      </div>
    );
  }

  componentDidMount() {
    const { _setCanvasSize } = this;
    _setCanvasSize();
  }

  componentDidUpdate() {
    this._drawLine();
  }

  _setCanvasSize() {
    const { _container } = this;
    const { clientWidth, clientHeight } = _container.current;
    const innerWidth = clientWidth - MARGIN.left - MARGIN.right;
    const innerHeight = clientHeight - MARGIN.top - MARGIN.bottom;
    this.setState(_setSize(clientWidth, clientHeight, innerWidth, innerHeight));
  }

  _drawLine() {
    const {
      _canvasLower,
      props: { series, xDomain, yDomain },
      state: { innerWidth, innerHeight },
    } = this;

    if (!series.length) return;

    const ctx = _canvasLower.current.getContext('2d');
    ctx.clearRect(
      0,
      0,
      _canvasLower.current.width,
      _canvasLower.current.height,
    );

    const xScale = _makeXScale(xDomain, innerWidth);
    const yScale = _makeYScale(yDomain, innerHeight);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const len1 = series.length;
    for (let i = 0; i < len1; i++) {
      const oneSeries = series[i];
      const len2 = oneSeries.length;
      if (len2 <= 1) continue;
      ctx.beginPath();
      ctx.moveTo(xScale(0), yScale(oneSeries[0]));
      for (let j = 1; j < len2; j++) {
        ctx.lineTo(xScale(j), yScale(oneSeries[j]));
      }
      const color = colorScale(i);
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
}

MainCenter.defaultProps = {
  series: [],
  xDomain: [0, 0],
  yDomain: [0, 0],
};

MainCenter.propTypes = {
  series: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  xDomain: PropTypes.arrayOf(PropTypes.number),
  yDomain: PropTypes.arrayOf(PropTypes.number),
};

export default MainCenter;
