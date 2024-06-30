import { Component } from '@angular/core';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import jsPDF from 'jspdf';

declare var cv: any; // Declare OpenCV

@Component({
  selector: 'app-photo-scanner',
  templateUrl: './photo-scanner.component.html',
  styleUrls: ['./photo-scanner.component.css']
})

export class PhotoScannerComponent {
  imageChangedEvent: any = '';
  croppedImage: any = '';

  onFileChange(event: any): void {
    this.imageChangedEvent = event;
    const file: File = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.detectEdges(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  detectEdges(imageSrc: string): void {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const src = cv.imread(image);
      const dst = new cv.Mat();
      cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
      cv.Canny(src, dst, 50, 150);
      
      // Detect edges (contours)
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      // Draw contours
      for (let i = 0; i < contours.size(); ++i) {
        const color = new cv.Scalar(255, 0, 0);
        cv.drawContours(src, contours, i, color, 2, cv.LINE_8, hierarchy, 100);
      }

      cv.imshow('canvasOutput', src);
      
      // Cleanup
      src.delete();
      dst.delete();
      contours.delete();
      hierarchy.delete();
    };
  }

  imageCropped(event: ImageCroppedEvent): void {
    this.croppedImage = event.base64;
  }

  downloadImage(): void {
    const link = document.createElement('a');
    link.href = this.croppedImage;
    link.download = 'scanned-document.png';
    link.click();
  }
}
