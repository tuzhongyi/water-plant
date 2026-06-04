import 'jquery-toast-plugin'
import './jquery.toast.min.css'
declare var $: any
type X = 'right' | 'left' | 'center'
type Y = 'top' | 'bottom' | 'center'
export class MessageBar {
  static success(text?: string, x: X = 'right', y: Y = 'bottom') {
    $.toast({
      text: text ? text : '操作成功',
      position: `${y}-${x}`,
      loaderBg: '#ff6849',
      icon: 'success',
      hideAfter: 3500,
      stack: 6,
    })
  }
  static error(text?: string, x: X = 'right', y: Y = 'bottom') {
    $.toast({
      text: text ? text : '操作失败',
      position: `${y}-${x}`,
      loaderBg: '#e6294b',
      icon: 'error',
      hideAfter: 3500,
      stack: 6,
    })
  }

  static warning(text?: string, x: X = 'right', y: Y = 'bottom') {
    $.toast({
      text: text ? text : '正在操作中...',
      position: `${y}-${x}`,
      loaderBg: '#ffb22b',
      icon: 'warning',
      hideAfter: 3500 * 2,
      stack: 6,
    })
  }

  static confirm(text: string, fn: Function) {
    $.confirm({
      text: text,
      okButton: '确定',
      cancelButton: '取消',
      okButtonClass: 'custom green  p-r-20 p-l-20',
      cancelButtonClass: 'switch blue p-r-20 p-l-20',
      top: -1,
      confirm: function () {
        fn()
      },
    })
  }
}
