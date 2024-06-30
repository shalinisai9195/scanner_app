import { Component } from '@angular/core';
import { WebcamImage } from 'ngx-webcam';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public webcamImage: WebcamImage = {} as WebcamImage;

  handleImageCapture(image: WebcamImage): void {
    // Process the captured image (edge detection, cropping, etc.)
    this.webcamImage = image;
  }

  captureImage(): void {
    // Trigger the image capture (you can call this method from your button)
    // You can also add logic for edge detection and cropping here
    console.log('Image captured:', this.webcamImage);
  }
}

