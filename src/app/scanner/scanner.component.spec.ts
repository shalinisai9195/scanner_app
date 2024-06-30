import { Component, OnInit } from '@angular/core';
import * as cv from '@techstark/opencv-js';

@Component({
  selector: 'app-scanner',
  templateUrl: './scanner.component.html',
  styleUrls: ['./scanner.component.css']
})
export class ScannerComponent implements OnInit {

  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  ngOnInit(): void {
    this.startCamera();
  }

  startCamera() {
    this.video = document.createElement('video');
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.context = this.canvas.getContext('2d');

    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      this.video.srcObject = stream;
      this.video.play();
      this.processFrame();
    });
  }

  processFrame() {
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    const src = cv.imread(this.canvas);
    const dst = new cv.Mat();
    
    // Convert to grayscale
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
    
    // Edge detection
    cv.Canny(dst, dst, 50, 150);
    
    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // Process contours to find document edges
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true);
      
      if (approx.rows === 4) {
        const points = [];
        for (let j = 0; j < 4; j++) {
          points.push({ x: approx.intAt(j, 0), y: approx.intAt(j, 1) });
        }
        this.drawDocumentEdges(points);
        break;
      }
      approx.delete();
      contour.delete();
    }

    src.delete();
    dst.delete();
    contours.delete();
    hierarchy.delete();

    requestAnimationFrame(() => this.processFrame());
  }

  drawDocumentEdges(points: {x: number, y: number}[]) {
    this.context.beginPath();
    this.context.moveTo(points[0].x, points[0].y);
    points.forEach(point => this.context.lineTo(point.x, point.y));
    this.context.closePath();
    this.context.lineWidth = 3;
    this.context.strokeStyle = 'blue';
    this.context.stroke();
  }
}
