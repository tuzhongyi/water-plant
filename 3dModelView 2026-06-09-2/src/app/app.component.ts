import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { BottomBarComponent } from './components/bottom-bar/bottom-bar.component';
import { LeftPanelComponent } from './components/left-panel/left-panel.component';
import { RightPanelComponent } from './components/right-panel/right-panel.component';
import { ViewerContainerComponent } from './components/viewer-container/viewer-container.component';
import { InfoCardComponent } from './components/info-card/info-card.component';
import { CameraInfoCardComponent } from './components/camera-info-card/camera-info-card.component';
import { ConfigService } from './services/config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TopBarComponent,
    BottomBarComponent,
    LeftPanelComponent,
    RightPanelComponent,
    ViewerContainerComponent,
    InfoCardComponent,
    CameraInfoCardComponent,
  ],
  template: `
    <div class="app-shell">
      <app-top-bar />
      <div class="main-area">
        <app-left-panel />
        <div class="canvas-container">
          <app-viewer-container />
          <app-info-card />
          <app-camera-info-card />
        </div>
        <app-right-panel />
      </div>
      <app-bottom-bar />
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex; flex-direction: column;
      width: 100vw; height: 100vh; overflow: hidden;
      background: #040a0b; color: #eee;
    }
    .main-area {
      flex: 1; display: flex; overflow: hidden;
    }
    .canvas-container {
      flex: 1; position: relative; overflow: hidden;
    }
  `],
})
export class AppComponent implements OnInit {
  private configService = inject(ConfigService);

  ngOnInit(): void {
    this.configService.autoLoadModels();
  }
}
