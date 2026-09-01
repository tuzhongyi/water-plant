import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'hw-system-download-header',
  imports: [CommonModule],
  templateUrl: './system-download-header.component.html',
  styleUrl: './system-download-header.component.less',
})
export class SystemDownloadHeaderComponent {
  on = {
    close: () => {
      window.close();
    },
  };
}
