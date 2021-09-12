const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'dist/bundle.js',
    path: path.resolve(__dirname)
  },
  mode: 'production',
  module: {
    rules: [{
      test: /\.tsx?$/,
      include: [
        path.resolve(__dirname, 'source')
      ],
      use: [{
        loader: 'babel-loader'
      }, {
        loader: 'ts-loader'
      }]
    }, {
      test: /\.jsx?$/,
      use: [{
        loader: 'babel-loader',
        options: {
          cacheDirectory: true
        }
      }]
    }, {
      test: /\.css$/,
      use: [{
        loader: 'style-loader'
      }, {
        loader: 'css-loader?'
      }]
    }, {
      test: /\.less$/,
      use: [{
        loader: 'style-loader'
      }, {
        loader: 'css-loader?'
      }, {
        loader: 'less-loader?'
      }]
    }, {
      test: /\.svg?$/,
      use: [{
        loader: 'svg-loader'
      }]
    }]
  },
  plugins: [
    // 处理HTML文件
    new HtmlWebpackPlugin({
      template: './public/index.html'
    }),
  ],
  devServer: {
    port: 9001,
    compress: true,
  }
}
