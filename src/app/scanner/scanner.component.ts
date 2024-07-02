import { Component, ElementRef, ViewChild } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { WebcamImage, WebcamInitError } from 'ngx-webcam';

declare var cv: any;

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html', 
  styleUrls: ['./scanner.component.css']
})
export class ScannerComponent {

  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  processedImage: string | null = null;
  showWebcam = true;
  videoOptions: MediaTrackConstraints = {
    facingMode: 'environment'
  };
  trigger: Subject<void> = new Subject<void>();

  get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  handleImage(webcamImage: WebcamImage): void {
    this.processImage(webcamImage.imageAsDataUrl);
  }

  handleInitError(error: WebcamInitError): void {
    console.error('Camera error:', error);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.processImage(e.target!.result as string);
      reader.readAsDataURL(file);
    }
  }

  processImage(imageData: string) {
    const image = new Image();
    image.src = imageData;
    image.onload = () => {
      const canvas = this.canvas.nativeElement;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);
        this.autoCrop(context);
      }
    };
  }

  autoCrop(context: CanvasRenderingContext2D) {

    const src = cv.imread(context.canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.Canny(gray, gray, 75, 200); // to finding a img edges 

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    //represented as a collection of points that outline the shapes in the image.
    cv.findContours(gray, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let maxContour = contours.get(0);
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > maxArea) {
        maxArea = area;
        maxContour = contour;
      }
    }

    // const rect = cv.boundingRect(maxContour);
    // const cropped = src.roi(rect);
    // cv.imshow(context.canvas, cropped);

    // src.delete(); gray.delete(); contours.delete(); hierarchy.delete();

    // this.processedImage = context.canvas.toDataURL('image/png');

    const peri = cv.arcLength(maxContour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(maxContour, approx, 0.02 * peri, true);

    if (approx.rows === 4) {
      const points = [];
      for (let i = 0; i < 4; i++) {
        points.push({
          x: approx.data32S[i * 2],
          y: approx.data32S[i * 2 + 1]
        });
      }

      // Sort points to get top-left, top-right, bottom-right, and bottom-left
      points.sort((a, b) => a.y - b.y);
      let topLeft, topRight, bottomLeft, bottomRight;
      if (points[0].x < points[1].x) {
        topLeft = points[0];
        topRight = points[1];
      } else {
        topLeft = points[1];
        topRight = points[0];
      }
      if (points[2].x < points[3].x) {
        bottomLeft = points[2];
        bottomRight = points[3];
      } else {
        bottomLeft = points[3];
        bottomRight = points[2];
      }

      // Draw the detected edges on the canvas
      context.beginPath();
      context.moveTo(topLeft.x, topLeft.y);
      context.lineTo(topRight.x, topRight.y);
      context.lineTo(bottomRight.x, bottomRight.y);
      context.lineTo(bottomLeft.x, bottomLeft.y);
      context.closePath();
      context.lineWidth = 3;
      context.strokeStyle = 'red';
      context.stroke();

      // Apply perspective transformation
      const dst = new cv.Mat();
      const dsize = new cv.Size(context.canvas.width, context.canvas.height);
      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        topLeft.x, topLeft.y,
        topRight.x, topRight.y,
        bottomRight.x, bottomRight.y,
        bottomLeft.x, bottomLeft.y
      ]);
      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        dsize.width, 0,
        dsize.width, dsize.height,
        0, dsize.height
      ]);
      const M = cv.getPerspectiveTransform(srcTri, dstTri);
      cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

      cv.imshow(context.canvas, dst);

      srcTri.delete(); dstTri.delete(); dst.delete(); M.delete();
    } else {
      // If no quadrilateral found, fallback to bounding box
      const rect = cv.boundingRect(maxContour);
      const cropped = src.roi(rect);
      cv.imshow(context.canvas, cropped);
      cropped.delete();
    }

    src.delete(); gray.delete(); contours.delete(); hierarchy.delete(); maxContour.delete(); approx.delete();

    this.processedImage = context.canvas.toDataURL('image/png');
  }

  downloadImage() {
    if (this.processedImage) {
      const link = document.createElement('a');
      link.href = this.processedImage;
      link.download = 'scanned-document.png';
      link.click();
    }
  }

  captureImage() {
    this.trigger.next();
  }

  toggleCamera() {
    this.showWebcam = false;
    setTimeout(() => {
      this.videoOptions.facingMode = (this.videoOptions.facingMode === 'environment') ? 'user' : 'environment';
      this.showWebcam = true;
    }, 100);
  }
}


