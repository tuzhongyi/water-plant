import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DeviceVideoDownloadParams } from '../../../common/data-core/request/services/device/device.params';
import { DeviceRequestService } from '../../../common/data-core/request/services/device/device.service';
import { LocalStorage } from '../../../common/storage/local.storage';
import { Duration } from '../../../common/tools/date-time-tool/duration.model';
import { DownloadTask, SystemDownloadArgs } from './system-download.model';

/**	下载任务业务：维护任务列表，按时长分割（单段≤30分钟），按最大并发数真实下载并保存到本地，超出限制的任务排队 */
@Injectable()
export class SystemDownloadBusiness {
  constructor(
    private service: DeviceRequestService,
    local: LocalStorage,
  ) {
    this.count = local.config.download.get().max;
  }

  private tasks: DownloadTask[] = [];
  /**	任务列表变更通知（携带最新列表），组件据此刷新 signal */
  changes = new Subject<DownloadTask[]>();

  private seq = 0;
  /**	最大并发下载数，超出部分排队 */
  private count = 5;
  /**	每个下载中任务对应的 AbortController，用于删除/暂停时中止底层请求 */
  private controllers = new Map<string, AbortController>();
  /**	已下载的数据块：暂停后继续下载时接着追加；删除/重试/重新下载时清空 */
  private buffers = new Map<string, Uint8Array<ArrayBuffer>[]>();
  /**	各任务已写入数据块的字节数：暂停时按它记进度，保证续传起点与已收数据一致 */
  private downloaded = new Map<string, number>();

  /**	按时长切割并创建下载任务加入队列，返回最新任务列表 */
  download(args: SystemDownloadArgs): DownloadTask[] {
    /*	结束时间不能超出当前时间：还没录到的片段服务端取不到，直接截到现在
        复制一份再改，避免改到调用方（界面上的时间选择器）持有的对象 */
    const now = new Date();
    let duration = args.duration;
    if (duration.end.getTime() > now.getTime()) {
      duration = { begin: duration.begin, end: now };
    }
    const created = this.split(duration).map((duration) =>
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
    this.abort(id);
    this.buffers.delete(id);
    this.downloaded.delete(id);
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.emit();
    this.schedule();
  }

  /**	取消下载（等同删除） */
  cancel(id: string): void {
    this.remove(id);
  }

  /**	暂停下载：保留已下载的数据块，进度按实际收到的字节记录 */
  pause(id: string): void {
    this.abort(id);
    let task = this.tasks.find((x) => x.id === id);
    if (!task) return;
    let loaded = this.downloaded.get(id);
    this.patch(id, { state: 'paused', loaded: loaded ?? task.loaded, speed: 0 });
  }

  /**	恢复下载：保留已下载的进度和数据块，从断点继续 */
  resume(id: string): void {
    this.requeue(id, false);
  }

  /**	重试失败任务：从头下载 */
  retry(id: string): void {
    this.requeue(id, true);
  }

  /**	重新下载已完成任务：从头下载 */
  redownload(id: string): void {
    this.requeue(id, true);
  }

  /**	@param reset true 表示丢弃已下载数据从头开始（重试/重新下载） */
  private requeue(id: string, reset: boolean): void {
    if (reset) {
      this.buffers.delete(id);
      this.downloaded.delete(id);
      this.patch(id, { state: 'queued', loaded: 0, total: 0, speed: 0, message: undefined });
    } else {
      /*	暂停后继续：进度和已下载的数据块都保留，等响应返回后再按状态码决定是否续传 */
      this.patch(id, { state: 'queued', speed: 0, message: undefined });
    }
    this.schedule();
  }

  /* ---- 内部 ---- */

  private emit(): void {
    this.changes.next(this.tasks);
  }

  /**	中止任务正在进行的下载请求（若存在），删除/暂停时调用 */
  private abort(id: string): void {
    this.controllers.get(id)?.abort();
    this.controllers.delete(id);
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

  /**	真实下载单个任务：请求二进制视频流 → 保存到本地 → 更新状态，完成后继续调度。
      暂停后继续时保留已下载的数据块，用 Range 从断点续传；服务端不支持时退回整段重下 */
  private async start(task: DownloadTask): Promise<void> {
    const controller = new AbortController();
    this.controllers.set(task.id, controller);
    /*	有已下载数据块时才续传，否则从 0 开始；续传起点取已收字节数，
        进度显示因 200ms 节流可能略小于它，不能直接用 task.loaded */
    let parts = this.buffers.get(task.id);
    let resumeFrom = parts ? (this.downloaded.get(task.id) ?? task.loaded) : 0;
    if (!parts) {
      parts = [];
      this.buffers.set(task.id, parts);
    }
    this.downloaded.set(task.id, resumeFrom);
    this.patch(task.id, { state: 'downloading', loaded: resumeFrom, speed: 0, message: undefined });
    // 实时进度：本次请求已下载字节（续传时加上断点前的进度）与速度，节流更新
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;
    let fullTotal = task.total;
    try {
      const timeRange = this.timeRange(task.duration);
      const fileName = `${task.name}_${timeRange}.mp4`;
      const params = new DeviceVideoDownloadParams();
      params.TimeRange = timeRange;
      params.VideoChannelId = task.videoChannelId;
      params.FileName = fileName;
      await this.service.download(
        params,
        {
          headers: resumeFrom > 0 ? { Range: `bytes=${resumeFrom}-` } : undefined,
          start: ({ status, length, total }) => {
            if (resumeFrom > 0 && status != 206) {
              /*	服务端不支持断点续传：丢掉旧数据，从头下载，进度归零重算 */
              parts.length = 0;
              resumeFrom = 0;
              lastLoaded = 0;
              this.downloaded.set(task.id, 0);
              fullTotal = total || length;
            } else if (status == 206) {
              /*	Content-Range 带整段总长；没有时用断点 + 本次剩余长度 */
              fullTotal = total > length ? total : resumeFrom + length;
            } else {
              fullTotal = total || length;
            }
            this.patch(task.id, { loaded: resumeFrom, total: fullTotal });
          },
          data: (chunk) => {
            parts.push(chunk);
            this.downloaded.set(task.id, (this.downloaded.get(task.id) ?? resumeFrom) + chunk.byteLength);
          },
          process: ({ loaded }) => {
            if (!this.active(task.id)) return;
            const now = Date.now();
            const elapsed = now - lastTime;
            if (elapsed < 200) return;
            const patch: Partial<DownloadTask> = {
              loaded: resumeFrom + loaded,
              speed: (loaded - lastLoaded) / (elapsed / 1000),
            };
            if (fullTotal > 0) patch.total = fullTotal;
            lastLoaded = loaded;
            lastTime = now;
            this.patch(task.id, patch);
          },
        },
        controller.signal,
      );
      /*	下载期间若被暂停/取消/删除，或已经被下一次续传取代，则不再保存 */
      if (this.controllers.get(task.id) !== controller || !this.active(task.id)) return;
      const blob = new Blob(parts, { type: 'video/mp4' });
      this.buffers.delete(task.id);
      this.downloaded.delete(task.id);
      this.save(blob, fileName);
      // 完成后的平均下载速度 = 本次实际下载字节 / 总耗时
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = elapsed > 0 ? Math.max(0, blob.size - resumeFrom) / elapsed : 0;
      this.patch(task.id, { state: 'completed', total: blob.size, loaded: blob.size, speed });
    } catch {
      /*	暂停/取消会先删掉 controller，这里才不会把暂停误标成失败；
          已经被下一次续传取代的旧请求也不能改状态 */
      if (this.controllers.get(task.id) === controller && this.active(task.id)) {
        /*	失败后只能重试（从头下载），顺手释放已下的数据块 */
        this.buffers.delete(task.id);
        this.downloaded.delete(task.id);
        this.patch(task.id, { state: 'failed', message: '下载失败' });
      }
    } finally {
      if (this.controllers.get(task.id) === controller) {
        this.controllers.delete(task.id);
      }
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
