import { ReqoreIntents } from '@qoretechnologies/reqore';
import { IReqoreTheme } from '@qoretechnologies/reqore/dist/constants/theme';

export const defaultReqoreTheme: Partial<IReqoreTheme> = {
  main: '#222222',
  intents: { success: '#4a7110', custom1: '#6e1977' },
};

export const defaultReqoreOptions = {
  animations: { buttons: false },
  withSidebar: true,
  closePopoversOnEscPress: true,
  tooltips: {
    delay: 300,
  },
};

export const QorusPurpleIntent = ReqoreIntents.CUSTOM1;
