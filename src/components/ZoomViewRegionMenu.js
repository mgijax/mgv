
//
import config from '@/config'
import KeyStore from '@/lib/KeyStore'
//
function getRegionMenu (thisObj) {
  return [{
      icon: 'delete',
      label: 'Delete',
      helpText: 'Delete this region.',
      handler: (function (cxt) {
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'remove' })
      }).bind(thisObj)
    }, {
      icon: '',
      label: 'Split',
      helpText: 'Split this region.',
      handler: (function (cxt) {
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'split' })
      }).bind(thisObj)
    }]
}

export default getRegionMenu
