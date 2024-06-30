import { Component } from '@angular/core';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

@Component({
  selector: 'app-document-scanner',
  templateUrl: './document-scanner.component.html',
  styleUrls: ['./document-scanner.component.css']
})

export class DocumentScannerComponent {
  video: HTMLVideoElement | null = null;
  processedImage: string | null = null;

  ngOnInit() {
    this.setupCamera();
  }

  async setupCamera() {
    this.video = document.createElement('video');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.video.srcObject = stream;
      await this.video.play();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }

  async captureImage() {
    if (this.video) {
      const canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(this.video, 0, 0, canvas.width, canvas.height);
      const capturedImage = canvas.toDataURL('image/png');

      await this.processImage(capturedImage);
    }
  }

  async processImage(imageSrc: string) {
    const image = new Image();
    image.src = imageSrc;

    image.onload = async () => {
      const model = await cocoSsd.load();
      const predictions = await model.detect(image);
      const documentPredictions = predictions.filter((pred: { class: string; }) => pred.class === 'document');

      if (documentPredictions.length > 0) {
        this.processedImage = this.cropAndTransform(image, documentPredictions[0].bbox);
      } else {
        console.log('No document detected');
      }
    };
  }

  cropAndTransform(image: HTMLImageElement, bbox: [number, number, number, number]): string {
    const [x, y, width, height] = bbox;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, x, y, width, height, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    }

    return '';
  }

  downloadImage() {
    if (this.processedImage) {
      const link = document.createElement('a');
      link.href = this.processedImage;
      link.download = 'scanned-document.png';
      link.click();
    }
  }
}
