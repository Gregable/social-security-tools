/**
 * A minimal recording stand-in for CanvasRenderingContext2D that captures the
 * text drawn (fillText) and the path moves (moveTo/lineTo) so tests can assert
 * what a renderer produced without a real canvas.
 */
export function recordingContext() {
  const fillTexts: string[] = [];
  const moveTos: Array<[number, number]> = [];
  const lineTos: Array<[number, number]> = [];
  const lineDashes: number[][] = [];
  const ctx = {
    fillTexts,
    moveTos,
    lineTos,
    lineDashes,
    // Settable style properties the renderers assign to.
    strokeStyle: '',
    fillStyle: '',
    lineCap: '',
    lineWidth: 0,
    lineDashOffset: 0,
    font: '',
    save() {},
    restore() {},
    beginPath() {},
    stroke() {},
    translate() {},
    rotate() {},
    setLineDash(segments: number[]) {
      lineDashes.push(segments);
    },
    fillRect() {},
    measureText(text: string) {
      // Width proportional to length is enough for layout math under test.
      return { width: text.length * 7 } as TextMetrics;
    },
    moveTo(x: number, y: number) {
      moveTos.push([x, y]);
    },
    lineTo(x: number, y: number) {
      lineTos.push([x, y]);
    },
    fillText(text: string) {
      fillTexts.push(text);
    },
  };
  return ctx;
}

export type RecordingContext = ReturnType<typeof recordingContext>;

/** Passes a recording context to a renderer that expects a real one. */
export function asCanvasContext(
  ctx: RecordingContext
): CanvasRenderingContext2D {
  return ctx as unknown as CanvasRenderingContext2D;
}
