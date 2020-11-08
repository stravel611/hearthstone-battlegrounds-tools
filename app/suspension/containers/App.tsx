import { ipcRenderer } from 'electron';
import React, { ReactNode } from 'react';
import { ThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { CssBaseline, Box } from '@material-ui/core';
import deepOrange from '@material-ui/core/colors/deepOrange';
import red from '@material-ui/core/colors/red';
import { useMount, useUpdateEffect } from 'ahooks';
import { useHistory } from 'react-router-dom';

import { LOGHANDLER_SUSPENSION_MESSAGE } from '@app/constants/topic';
import type { Filtered } from '@logHandler/parser';
import useStateFlow from '@suspension/hooks/useStateFlow';
import useBoxFlow from '@suspension/hooks/useBoxFlow';
import routes from '@suspension/constants/routes.json';

type Props = {
  children: ReactNode;
};

const JianLiBianFont = {
  fontFamily: 'JianLiBian',
  fontStyle: 'normal',
  src: `
    url(${require('../assets/fonts/JianLiBian.woff2').default}) format('woff2'),
    url(${require('../assets/fonts/JianLiBian.woff').default}) format('woff'),
    url(${
      require('../assets/fonts/JianLiBian.ttf').default
    }) format('truetype'),
    url(${require('../assets/fonts/JianLiBian.svg').default}) format('svg')
  `,
};
const BelweBoldFont = {
  fontFamily: 'Belwe Bold',
  fontStyle: 'normal',
  src: `
    url(${require('../assets/fonts/Belwe-Bold.woff2').default}) format('woff2'),
    url(${require('../assets/fonts/Belwe-Bold.woff').default}) format('woff'),
    url(${require('../assets/fonts/Belwe-Bold.ttf').default})
  `,
};
const theme = createMuiTheme({
  typography: {
    fontFamily: 'JianLiBian,Belwe Bold,Georgia,Times,Times New Roman,serif',
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        '@font-face': [JianLiBianFont, BelweBoldFont],
        html: {
          height: '100%',
        },
        body: {
          height: '100%',
          overflow: 'hidden',
          background: 'none !important',
          userSelect: 'none',
          cursor: `url("${
            require('../assets/images/hand.png').default
          }") 0 0,auto`,
        },
        '#root': {
          height: '100%',
          overflow: 'hidden',
        },
        img: {
          display: 'block',
          width: '100%',
        },
      },
    },
  },
  palette: {
    primary: {
      main: deepOrange[500],
    },
    secondary: {
      main: red[500],
    },
  },
});

export default function App(props: Props) {
  const { children } = props;
  const history = useHistory();
  const [stateFlow, setStateFlow] = useStateFlow();
  const [, setBoxFlow] = useBoxFlow();

  useMount(() => {
    ipcRenderer.on(
      LOGHANDLER_SUSPENSION_MESSAGE,
      (_event, args: { type: 'box' | 'state'; source: Filtered }) => {
        if (args.type === 'box') {
          setBoxFlow(args.source);
        }
        if (args.type === 'state') {
          setStateFlow(args.source);
        }
      }
    );
  });

  useUpdateEffect(() => {
    // state 收到开始 跳转至英雄选择页
    if (stateFlow?.current === 'GAME_START') {
      ipcRenderer.send('showSuspension');
      history.push(routes.HEROSELECTION);
    }
    // 容错处理，当前页面不再英雄选择页时跳转至英雄选择页
    if (stateFlow?.current === 'HERO_TOBE_CHOSEN') {
      if (history.location.pathname !== '/heroSelection') {
        ipcRenderer.send('showSuspension');
        history.push(routes.HEROSELECTION);
      }
    }
    // 英雄选择后 隐藏悬浮
    if (stateFlow?.current === 'HERO_CHOICES') {
      ipcRenderer.send('hideSuspension');
    }
    // 对局结束 显示悬浮展示战绩
    if (stateFlow?.current === 'GAME_OVER') {
      ipcRenderer.send('showSuspension');
      history.push(routes.GAMEOVER);
    }
  }, [stateFlow]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box height="100%" display="flex" flexDirection="column">
        <Box flex={1} overflow="auto">
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
