declare namespace cv{
    function Mat(): any;
}

declare module 'opencv.js' {
    const cv: any;
    export default cv;
  }