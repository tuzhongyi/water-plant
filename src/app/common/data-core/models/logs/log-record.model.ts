import { Transform } from 'class-transformer';
import { IIdModel } from '../interface/model.interface';
import { Transformer } from '../transformer';

/**	LogRecord (日志记录)	*/
export class LogRecord implements IIdModel {
  /**	String	记录ID	M	*/
  Id!: string;
  /**	String	日志内容	O	*/
  Content?: string;
  /**	Int32	日志类型	M	*/
  LogType!: number;
  /**	DateTime	日志时间	M	*/
  @Transform(Transformer.datetime)
  Time!: Date;
  /**	String	操作用户	M	*/
  Username!: string;
  /**	Int32	日志级别	O	*/
  Level?: number;
}
