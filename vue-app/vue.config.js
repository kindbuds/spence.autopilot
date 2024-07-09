const { defineConfig } = require('@vue/cli-service')
const { VuetifyLoaderPlugin } = require('vuetify-loader')
// const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: 'all',
  },
  publicPath: process.env.NODE_ENV !== 'development' ? './' : '/',
  configureWebpack: {
    plugins: [
      new VuetifyLoaderPlugin(),
    ],
  },
  chainWebpack: config => {
    // Remove the default HtmlWebpackPlugin instance
    config.plugins.delete('html');

    // Add a custom HtmlWebpackPlugin instance
    config.plugin('html')
      .use(HtmlWebpackPlugin, [{
        template: 'public/index.html',
        inject: 'body',
        meta: {
          'Content-Security-Policy': {
            'http-equiv': 'Content-Security-Policy',
            'content': "default-src * 'unsafe-inline' 'unsafe-eval' data:;"
          }
        }
      }]);

    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.compilerOptions = {
          ...options.compilerOptions,
          isCustomElement: tag => tag === 'webview',
        };
        return options;
      });
  },
});
