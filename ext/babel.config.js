module.exports = {
    env: {
      test: {
        plugins: [
          [
            'module-resolver',
            {
              root:  ['.'],
              alias: {
                '@':           '.',
                '~':           '.',
                '@accuknox': './pkg/accuknox',
              },
            },
          ],
        ],
        presets: ['@babel/preset-env'],
      },
    },
  };
  