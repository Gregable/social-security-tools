/**
 * A minimal recording stand-in for CanvasRenderingContext2D, so tests can
 * assert what a renderer produced without a real canvas. It captures the text
 * drawn (fillText), the path moves (moveTo/lineTo), the origin moves
 * (translate) and the dash patterns set (setLineDash).
 *
 * save() and restore() do nothing, so a style property a renderer assigns can
 * still be read after the renderer returns.
 */
export function recordingContext() {
  const fillTexts: string[] = [];
  const moveTos: Array<[number, number]> = [];
  const lineTos: Array<[number, number]> = [];
  const translates: Array<[number, number]> = [];
  const lineDashes: number[][] = [];
  const ctx = {
    fillTexts,
    moveTos,
    lineTos,
    translates,
    lineDashes,
    // Settable style properties the renderers assign to.
    strokeStyle: '',
    fillStyle: '',
    globalAlpha: 1,
    lineCap: '',
    lineWidth: 0,
    lineDashOffset: 0,
    font: '',
    save() {},
    restore() {},
    beginPath() {},
    stroke() {},
    fill() {},
    rotate() {},
    fillRect() {},
    translate(x: number, y: number) {
      translates.push([x, y]);
    },
    setLineDash(segments: number[]) {
      lineDashes.push(segments);
    },
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
