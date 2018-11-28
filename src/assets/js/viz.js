import * as d3 from 'd3';

function makeLinearScale(domain, range) {
  return d3
    .scaleLinear()
    .domain(domain)
    .range(range);
}

function makeLinearScaleX(domain, width) {
  return makeLinearScale(domain, [0, width]);
}

function makeLinearScaleY(domain, height) {
  return makeLinearScale(domain.slice().reverse(), [0, height]);
}

function transformCanvas(context, tx, ty, sx, sy) {
  context.setTransform(sx, 0, 0, sy, tx, ty);
  return context;
}

function clearCanvasByContext(context) {
  const canvas = context.canvas;

  context.save();

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.restore();

  return context;
}

function clearCanvas(canvas) {
  const context = canvas.getContext('2d');

  clearCanvasByContext(context);

  return canvas;
}

function calcTransformedCoord(a, b, c, d, e, f, x, y) {
  return [a * x + c * y + e, b * x + d * y + f];
}

function transformCoord(tx, ty, sx, sy, x, y) {
  return [sx * x + tx, sy * y + ty];
}

function transformCoordX(tx, sx, x) {
  return sx * x + tx;
}

function transformCoordY(ty, sy, y) {
  return sy * y + ty;
}

function calcInversedCoord(a, b, c, d, e, f, x, y) {
  return [
    (d * x - c * y + c * f - d * e) / (a * d - b * c),
    (a * y - b * x + b * e - a * f) / (a * d - b * c),
  ];
}

function inverseCoord(tx, ty, sx, sy, x, y) {
  return [(x - tx) / sx, (y - ty) / sy];
}

function inverseCoordX(tx, sx, x) {
  return (x - tx) / sx;
}

function inverseCoordY(ty, sy, y) {
  return (y - ty) / sy;
}

function concatTransformMatrix(a1, b1, c1, d1, e1, f1, a2, b2, c2, d2, e2, f2) {
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

function concatTransform(tx1, ty1, sx1, sy1, tx2, ty2, sx2, sy2) {
  return [tx1 * sx2 + tx2, ty1 * sy2 + ty2, sx1 * sx2, sy1 * sy2];
}

function drawLineInCanvas(
  context,
  series,
  scaleX = v => v,
  scaleY = v => v,
  getX = v => v.x,
  getY = v => v.y,
) {
  const len = series.length;

  if (len <= 1) return;

  context.beginPath();
  context.moveTo(
    scaleX(getX(series[0], 0, series)),
    scaleY(getY(series[0], 0, series)),
  );
  for (let i = 1; i < len; i++) {
    context.lineTo(
      scaleX(getX(series[i], i, series)),
      scaleY(getY(series[i], i, series)),
    );
  }
  context.stroke();

  return context;
}

export {
  makeLinearScale,
  makeLinearScaleX,
  makeLinearScaleY,
  transformCanvas,
  clearCanvasByContext,
  clearCanvas,
  calcTransformedCoord,
  transformCoord,
  transformCoordX,
  transformCoordY,
  calcInversedCoord,
  inverseCoord,
  inverseCoordX,
  inverseCoordY,
  concatTransformMatrix,
  concatTransform,
  drawLineInCanvas,
};
