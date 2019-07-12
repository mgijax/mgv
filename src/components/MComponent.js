/* MComponent
 * Adds a computed attribute (cfg) to the options parameter for a Vue component.
 * Contains the configuration setting defined in config.js for this class.
 * Usage:
 *    new Vue(MComponent({ options })
 */
import config from '@/config'
import Vue from 'vue'

//let dm = new DataManager(config.DataManager.runtimeConfigFile)

export default function (cfg) {
  cfg.computed = cfg.computed || {}
  cfg.computed.cfg = function () {
    let c = Object.assign({}, config['all'], config[cfg.name])
    return c
  }
  cfg.computed.app = function () { return this.$root.$children[0].$children[0] }
  cfg.methods = cfg.methods || {}
  cfg.methods.nextTick = Vue.nextTick
  return cfg
}
