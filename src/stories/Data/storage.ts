export const storiesStorageMockEmpty = [
  {
    url: 'https://hq.qoretechnologies.com:8092/api/latest/users/_current_/storage',
    method: 'GET',
    status: 200,
    response: {},
  },
];

export const storiesStorageMockWithSidebarSize = [
  {
    url: 'https://hq.qoretechnologies.com:8092/api/latest/users/_current_/storage',
    method: 'GET',
    status: 200,
    response: {
      'sidebar-size': 350,
    },
  },
];

export const storiesStorageMockWithDisabledAiModal = [
  {
    url: 'https://hq.qoretechnologies.com:8092/api/latest/users/_current_/storage',
    method: 'GET',
    status: 200,
    response: {
      ide: {
        config: {
          allowAiCreateDialog: {
            type: 'boolean',
            value: false,
          },
        },
      },
    },
  },
];
