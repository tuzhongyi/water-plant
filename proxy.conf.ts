/*
 * @Author: pmx
 * @Date: 2022-11-03 09:56:29
 * @Last Modified by: zzl
 * @Last Modified time: 2026-06-03 16:25:11
 */
const PROXY_CONFIG = [
  {
    context: ['/api/howell/ver10/data_service/'],
    // target: 'http://iebs.51hws.cn',
    // target: 'http://192.168.21.241:9000',

    // target: 'http://101.91.121.126',
    target: 'http://192.168.21.122:10000',
    // target: 'http://garbage01.51hws.com',
    changeOrigin: true,

    secure: false,
    headers: {
      Connection: 'keep-alive',
    },
  },

  {
    context: [, '/video/wsplayer/'],
    target: 'http://192.168.21.122:8800',
    changeOrigin: true,
    secure: false,
  },
  // {
  //   context: ['/amap/'],
  //   // target: 'http://192.168.21.241:9000',
  //   // target: 'http://garbage01.51hws.com',
  //   target: 'http://127.0.0.1:8011',
  //   changeOrigin: true,
  //   secure: false,
  // },
];

export default PROXY_CONFIG;
