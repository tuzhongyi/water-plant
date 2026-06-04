import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FileReadType,
  UploadControlFile,
  UploadControlFileInfo,
} from './upload-control.model';

@Component({
  selector: 'upload-control',
  templateUrl: './upload-control.component.html',
  styleUrls: ['./upload-control.component.less'],
})
export class UploadControlComponent implements OnInit {
  @Input() accept: string = '*.png|*.jpg|*.jpeg|*.bmp';

  @Input() type: FileReadType = FileReadType.DataURL;
  @Input() encoding?: string;
  @Input() multiple = false;

  @Output() upload = new EventEmitter<UploadControlFile>();
  @Output() loadstart = new EventEmitter<UploadControlFileInfo>();

  constructor() {}

  @ViewChild('file') element?: ElementRef<HTMLInputElement>;
  get file() {
    return this.element?.nativeElement;
  }

  ngOnInit(): void {}
  onupload() {
    if (this.file) {
      this.file.click();
    }
  }
  fileChange() {
    if (this.file) {
      const t_files = this.file.files;

      let infos = [];

      if (t_files && t_files.length > 0) {
        for (let i = 0; i < t_files.length; i++) {
          let name = t_files[i].name;
          this.uploadFile(name, t_files[i]);
          infos.push({ filename: t_files[i].name });
        }
        this.file.value = '';
      }
    }
  }
  async uploadFile(name: string, file: any) {
    var reader = new FileReader();
    reader.addEventListener('loadstart', (evt) => {
      this.loadstart.emit({ filename: name, size: evt.total });
    });
    reader.addEventListener('load', (evt) => {
      let reader = evt.target as FileReader;
      this.upload.emit({
        filename: name,
        size: evt.total,
        data: reader.result,
      });
    });
    switch (this.type) {
      case FileReadType.ArrayBuffer:
        reader.readAsArrayBuffer(file);
        break;
      case FileReadType.BinaryString:
        reader.readAsBinaryString(file);
        break;
      case FileReadType.DataURL:
        reader.readAsDataURL(file);
        break;
      case FileReadType.Text:
        reader.readAsText(file, this.encoding);
        break;

      default:
        break;
    }
  }
}
