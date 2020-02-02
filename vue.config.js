const path = require('path')
const projectRoot = path.resolve(__dirname)
module.exports = {
  publicPath: '',
  configureWebpack: {
    resolve: {
      alias: {
        '@': `${projectRoot}/src/`
      }
    }
  }
}
