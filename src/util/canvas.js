export function isCanvasBlank(canvas) {
  const ctx = canvas.getContext('2d');
  const pixelBuffer = new Uint32Array(
    ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer,
  );
  return !pixelBuffer.some(color => color !== 0);
}

function isColumnBlank(imageData, width, x, top, bottom) {
  for (let y = top; y < bottom; y += 1) {
    if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
  }
  return true;
}

function isRowBlank(imageData, width, y) {
  for (let x = 0; x < width; x += 1) {
    if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
  }
  return true;
}

function trimWhitespace(canvas) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const imageData = ctx.getImageData(0, 0, size, size);
  let bottom = size; let right = size; let top = 0; let left = 0;
  while (top < bottom && isRowBlank(imageData, size, top)) top += 1;
  while (bottom - 1 > top && isRowBlank(imageData, size, bottom - 1)) bottom -= 1;
  while (left < right && isColumnBlank(imageData, size, left, top, bottom)) left += 1;
  while (right - 1 > left && isColumnBlank(imageData, size, right - 1, top, bottom)) right -= 1;
  const trimmedImageData = ctx.getImageData(left, top, right - left, bottom - top);
  const canvasCopy = canvas.ownerDocument.createElement('canvas');
  const canvasCopyCtx = canvasCopy.getContext('2d');
  canvasCopy.width = trimmedImageData.width;
  canvasCopy.height = trimmedImageData.height;
  canvasCopyCtx.putImageData(trimmedImageData, 0, 0);
  return canvasCopy;
}

export function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function downloadCanvas(canvas) {
  if (!isCanvasBlank(canvas)) {
    const trimmedCanvas = trimWhitespace(canvas);
    const downloadLink = trimmedCanvas.ownerDocument.createElement('a');
    downloadLink.href = trimmedCanvas.toDataURL();
    downloadLink.download = 'pixel_art';
    downloadLink.click();
  }
}

export function bucketFill(canvas, row, col, fill) {
  const target = canvas[row][col];
  function flow(row, col) {
    if (row >= 0 && row < canvas.length && col >= 0 && col < canvas[row].length) {
      if (canvas[row][col] === target) {
        canvas[row][col] = fill;
        flow(row - 1, col); // check up
        flow(row + 1, col); // check down
        flow(row, col - 1); // check left
        flow(row, col + 1); // check right
      }
    }
  }
  flow(row, col);
  return canvas;
}

export const canvasQuotes = [{
  text: "It's so fine and yet so terrible to stand in front of a blank canvas.",
  author: 'Paul Cezanne',
}, {
  text: 'A canvas is never empty.',
  author: 'Robert Rauschenberg',
}, {
  text: 'The world is but a canvas to our imagination.',
  author: 'Henry David Thoreau',
}, {
  text: "The canvas paints itself. I'm just the middleman.",
  author: 'Peter Max',
}, {
  text: 'The colors live a remarkable life of their own after they have been applied to the canvas.',
  author: 'Edvard Munch',
}, {
  text: 'I put on the canvas whatever comes into my mind.',
  author: 'Frida Kahlo',
}];
