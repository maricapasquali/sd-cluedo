const path = require('path');
const fs = require('fs');
// eslint-disable-next-line node/no-unpublished-require
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const devPeerServerPort = Number(process.env.PEER_PORT) || 3001;

module.exports = {
  pages: {
    index: {
      entry: 'main.ts',
      title: 'Cluedo',
      template: 'public/index.html',
    },
  },
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'thread-loader',
            },
            {
              loader: 'ts-loader',
              options: {
                happyPackMode: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [new ForkTsCheckerWebpackPlugin()],
    watchOptions: {
      // for some systems, watching many files can result in a lot of CPU or memory usage
      // https://webpack.js.org/configuration/watch/#watchoptionsignored
      // don't use this pattern, if you have a monorepo with linked packages
      ignored: /node_modules/,
    },
  },

  devServer: {
    server: {
      type: 'https',
      options: {
        key: fs.readFileSync(path.resolve('..', 'sslcert', 'privatekey.pem')),
        cert: fs.readFileSync(path.resolve('..', 'sslcert', 'cert.pem')),
      },
    },
    proxy: {
      '^/socket.io': {
        target: 'https://localhost:' + devPeerServerPort,
        changeOrigin: true,
        ws: true,
      },
      '^/api/v1': {
        target: 'https://localhost:' + devPeerServerPort,
        changeOrigin: true,
      },
    },
  },
};
