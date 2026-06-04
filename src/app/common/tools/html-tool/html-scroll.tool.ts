export class HtmlScrollTool {
  thumb = {
    height: (div: HTMLElement) => {
      // 校验参数：确保传入的是有效的DIV元素
      if (!div || div.nodeName !== 'DIV') {
        console.error('参数必须是有效的DIV元素');
        return 0;
      }

      // 1. 获取DIV的核心尺寸（仅基于DIV本身）
      const divClientHeight = div.clientHeight; // DIV可视高度（不含边框、滚动条）
      const divScrollHeight = div.scrollHeight; // DIV内容总高度（包含溢出部分）

      // 2. 无滚动条的情况（内容高度 ≤ 可视高度）
      if (divScrollHeight <= divClientHeight) {
        console.log('当前DIV无滚动条，滑块高度为0');
        return 0;
      }

      // 3. 计算滑块高度（核心公式）
      const thumbHeight = (divClientHeight / divScrollHeight) * divClientHeight;
      // 保留2位小数，避免精度问题
      return Math.round(thumbHeight * 100) / 100;
    },
    width: (div: HTMLElement) => {
      // 校验参数：确保传入的是有效的DIV元素
      if (!div || div.nodeName !== 'DIV') {
        console.error('参数必须是有效的DIV元素');
        return 0;
      }

      // 1. 获取DIV水平方向的核心尺寸（仅基于DIV本身）
      const divClientWidth = div.clientWidth; // DIV可视宽度（不含边框、滚动条）
      const divScrollWidth = div.scrollWidth; // DIV内容总宽度（包含溢出部分）

      // 2. 无水平滚动条的情况（内容宽度 ≤ 可视宽度）
      if (divScrollWidth <= divClientWidth) {
        console.log('当前DIV无水平滚动条，滑块宽度为0');
        return 0;
      }

      // 3. 计算水平滚动条滑块宽度（核心公式）
      const thumbWidth = (divClientWidth / divScrollWidth) * divClientWidth;
      // 保留2位小数，避免精度问题
      return Math.round(thumbWidth * 100) / 100;
    },
  };
}
