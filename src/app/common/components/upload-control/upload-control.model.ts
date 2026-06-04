export enum FileReadType {
  ArrayBuffer,
  BinaryString,
  DataURL,
  Text,
}
export type FileResult = string | ArrayBuffer | null;

export interface UploadControlFileInfo {
  filename: string;
  size?: number;
  completed?: boolean;
}
export interface UploadControlFile extends UploadControlFileInfo {
  data: FileResult;
}
