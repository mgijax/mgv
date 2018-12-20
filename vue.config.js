const path = require('path')
const projectRoot = path.resolve(__dirname)
module.exports = {
  baseUrl: '',
  configureWebpack: {
    resolve: {
      alias: {
        '@': `${projectRoot}/src/`
      }
    }
  }
}
