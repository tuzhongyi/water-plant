/** 设备子服务清单：引入即触发各子服务模块的 registerDevicePlugin 自注册。
 *  新增子服务时只需在此加一行 import，无需改动 device.service.ts。 */
import './device-video-channel.service';
import './device-face-snap.service';
import './device-video-channel-view-group.service';
