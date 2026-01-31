declare module 'screenshot-desktop' {
  interface ScreenshotOptions {
    screen?: number;
    format?: 'png' | 'jpg';
  }

  function screenshot(options?: ScreenshotOptions): Promise<Buffer>;

  namespace screenshot {
    function listDisplays(): Promise<any[]>;
  }

  export = screenshot;
}
