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
        this.autoCrop(context, canvas.width, canvas.height);
      }
    };
  }

  autoCrop(context: CanvasRenderingContext2D, width: number, height: number) {
    const src = cv.imread(context.canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.Canny(gray, gray, 75, 200);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
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

    const rect = cv.boundingRect(maxContour);
    const cropped = src.roi(rect);
    cv.imshow(context.canvas, cropped);

    src.delete(); gray.delete(); contours.delete(); hierarchy.delete();

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
