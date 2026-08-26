import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DeviceVideoDownloadParams } from '../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';
import { DownloadTask, SystemDownloadArgs } from './system-download.model';

/**	下载任务业务：维护任务列表，按时长分割（单段≤30分钟），按最大并发数真实下载并保存到本地，超出限制的任务排队 */
@Injectable()
export class SystemDownloadBusiness {
  constructor(private service: DeviceRequestService) {}

  private tasks: DownloadTask[] = [];
  /**	任务列表变更通知（携带最新列表），组件据此刷新 signal */
  changes = new Subject<DownloadTask[]>();

  private seq = 0;
  /**	最大并发下载数，超出部分排队 */
  private count = 5;

  /**	按时长切割并创建下载任务加入队列，返回最新任务列表 */
  download(args: SystemDownloadArgs): DownloadTask[] {
    const created = this.split(args.duration).map((duration) =>
      this.task.create(args.channelId, args.name, duration),
    );
    this.tasks = [...created, ...this.tasks];
    this.emit();
    this.schedule();
    return this.tasks;
  }

  /* ---- 任务操作 ---- */

  /**	删除任务 */
  remove(id: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.emit();
  }

  /**	取消下载（等同删除） */
  cancel(id: string): void {
    this.remove(id);
  }

  /**	暂停下载 */
  pause(id: string): void {
    this.patch(id, { state: 'paused' });
  }

  /**	恢复下载 */
  resume(id: string): void {
    this.requeue(id);
  }

  /**	重试失败任务 */
  retry(id: string): void {
    this.requeue(id);
  }

  /**	重新下载已完成任务 */
  redownload(id: string): void {
    this.requeue(id);
  }

  private requeue(id: string): void {
    this.patch(id, { state: 'queued', loaded: 0, total: 0, speed: 0 });
    this.schedule();
  }

  /* ---- 内部 ---- */

  private emit(): void {
    this.changes.next(this.tasks);
  }

  /**	时长切割：单段最长 30 分钟，超出自动分割成多个片段（最新时间段在前） */
  private split(duration: Duration): Duration[] {
    const max = 30 * 60 * 1000; // 30 分钟
    const segments: Duration[] = [];
    let begin = new Date(duration.begin.getTime());
    while (begin.getTime() < duration.end.getTime()) {
      const end = new Date(Math.min(begin.getTime() + max, duration.end.getTime()));
      segments.push({ begin, end });
      begin = end;
    }
    return segments.reverse();
  }

  private task = {
    create: (channelId: string, name: string, duration: Duration): DownloadTask => {
      return {
        id: `download_${++this.seq}`,
        name: name || channelId,
        videoChannelId: channelId,
        duration,
        total: 0,
        loaded: 0,
        speed: 0,
        state: 'queued',
      };
    },
  };

  /**	时间范围字符串（yyyyMMddHHmmss_yyyyMMddHHmmss），用于服务端下载 */
  private timeRange(duration: Duration): string {
    return `${formatDate(duration.begin, 'yyyyMMddHHmmss', 'en')}_${formatDate(duration.end, 'yyyyMMddHHmmss', 'en')}`;
  }

  /**	调度：并发未满时逐个启动排队任务，直至达到最大并发数 */
  private schedule(): void {
    while (this.tasks.filter((t) => t.state === 'downloading').length < this.count) {
      const next = this.tasks.find((t) => t.state === 'queued');
      if (!next) return;
      this.start(next);
    }
  }

  /**	真实下载单个任务：请求二进制视频流 → 保存到本地 → 更新状态，完成后继续调度 */
  private async start(task: DownloadTask): Promise<void> {
    this.patch(task.id, { state: 'downloading' });
    // 实时进度：已下载字节与速度（节流更新，避免频繁触发界面刷新）
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;
    try {
      const timeRange = this.timeRange(task.duration);
      const fileName = `${task.name}_${timeRange}.mp4`;
      const params = new DeviceVideoDownloadParams();
      params.TimeRange = timeRange;
      params.VideoChannelId = task.videoChannelId;
      params.FileName = fileName;
      const blob = await this.service.download(params, (loaded, total) => {
        if (!this.active(task.id)) return;
        const now = Date.now();
        const elapsed = now - lastTime;
        if (elapsed < 200) return;
        const patch: Partial<DownloadTask> = {
          loaded,
          speed: (loaded - lastLoaded) / (elapsed / 1000),
        };
        if (total > 0) patch.total = total;
        lastLoaded = loaded;
        lastTime = now;
        this.patch(task.id, patch);
      });
      // 下载期间若被暂停/取消/删除，则不再保存或标记完成
      if (!this.active(task.id)) return;
      this.save(blob, fileName);
      // 完成后的平均下载速度 = 总字节 / 总耗时
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? blob.size / elapsed : 0;
      this.patch(task.id, { state: 'completed', total: blob.size, loaded: blob.size, speed });
    } catch {
      if (this.active(task.id)) {
        this.patch(task.id, { state: 'failed', message: '下载失败' });
      }
    } finally {
      this.schedule();
    }
  }

  /**	任务是否仍处于下载中（未被打断） */
  private active(id: string): boolean {
    return this.tasks.some((t) => t.id === id && t.state === 'downloading');
  }

  private save(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  private patch(id: string, patch: Partial<DownloadTask>): void {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    this.emit();
  }
}
