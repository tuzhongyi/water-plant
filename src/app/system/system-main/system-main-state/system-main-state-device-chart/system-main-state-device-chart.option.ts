export const SystemMainStateDeviceEChartOption: any = {
  series: [
    {
      type: 'gauge',
      min: 0,
      max: 100,
      z: 1,
      startAngle: 90,
      endAngle: 450,
      radius: '50%',
      center: ['50%', '50%'],
      silent: true,
      progress: {
        show: true,
        roundCap: true,
        z: 1,
        width: 3,
        itemStyle: {
          // color: new echarts.graphic.LinearGradient(1, 0, 1, 0)
          color: {
            type: 'linear',
            x: 1,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(23, 241, 198, 0)' },
              { offset: 1, color: '#17f1c6' },
            ],
          },
        },
      },
      axisLine: {
        lineStyle: {
          width: 0,
        },
      },
      splitLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      anchor: {
        show: false,
        size: 98,
        keepAspect: true,
        itemStyle: {
          color: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.6,
            colorStops: [
              {
                offset: 1,
                color: 'rgba(23, 241, 198, 0.5)', // 渐变结束颜色
              },
              {
                offset: 0.5,
                color: 'rgba(23, 241, 198, 0)', // 渐变开始颜色,
              },
            ],
          },
          borderColor: 'rgba(23, 241, 198, 0.2)',
          borderWidth: 3,
        },
      },

      pointer: {
        show: false,
      },
      detail: {
        valueAnimation: true,

        offsetCenter: [0, 0],
        rich: {
          value: {
            fontFamily: 'howell light',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 30,
          },
          unit: {
            fontFamily: 'howell light',
            color: '#fff',
            fontSize: 16,
            fontWeight: 'normal',
            padding: [0, 0, -14, 0],
          },
        },
        formatter: (value: number) => {
          return `{value|${value.toFixed(0)}}{unit|%}`;
        },
      },
      data: [{ value: 0 }],
    },
    {
      type: 'gauge',
      z: 2,
      min: 0,
      max: 100,
      startAngle: 90,
      endAngle: 450,
      radius: '50%',
      center: ['50%', '50%'],
      silent: true,
      progress: {
        show: false,
      },
      pointer: {
        show: true,
        length: 6,
        icon: 'circle',
        showAbove: true,
        offsetCenter: [0, '-90%'],
        itemStyle: {
          color: 'rgba(255,255,255,0.8)',
          shadowColor: '#ffffff',
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
        },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        show: false,
      },
      axisLabel: {
        show: false,
      },
      anchor: {
        show: false,
      },
      title: {
        show: false,
      },
      detail: {
        show: false,
      },
      data: [{ value: 0 }],
    },
    {
      type: 'pie',
      z: 2,
      stargAngle: 90,
      radius: ['55%', '85%'],
      avoidLabelOverlap: false,
      silent: true,
      itemStyle: {
        borderRadius: 0,
      },
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      data: [
        {
          value: 0,
          name: 'online',
          itemStyle: {
            color: 'rgba(23, 241, 198, 0.5)',
            borderColor: '#183B3F',
            borderWidth: 5,
          },
        },
        {
          value: 0,
          name: 'offline',
          itemStyle: {
            color: 'rgba(255, 131, 115, 0.5)',
            borderColor: '#183B3F',
            borderWidth: 5,
          },
        },
      ],
    },
    {
      type: 'pie',
      z: 1,
      stargAngle: 90,
      radius: ['75%', '85%'],
      avoidLabelOverlap: false,
      silent: true,
      itemStyle: {
        borderRadius: 0,
      },
      label: {
        show: false,
      },
      labelLine: {
        show: false,
      },
      data: [
        {
          value: 0,
          name: 'online',
          itemStyle: {
            color: '#17f1c6',
            borderColor: '#183B3F',
            borderWidth: 5,
          },
        },
        {
          value: 0,
          name: 'offline',
          itemStyle: {
            color: '#ff8373',
            borderColor: '#183B3F',
            borderWidth: 5,
          },
        },
      ],
    },
  ],
};
