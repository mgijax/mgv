
//
import config from '@/config'
import KeyStore from '@/lib/KeyStore'
//
function getRegionMenu (thisObj) {
  return [{
      // zoom in
      icon: 'zoom_in',
      label: 'Zoom in',
      helpText: 'Zoom in',
      handler: (function (cxt) {
        const amt = 5
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'zoom', amt: amt })
      }).bind(thisObj)
    }, {
      // zoom out
      icon: 'zoom_out',
      label: 'Zoom out',
      helpText: 'Zoom out',
      handler: (function (cxt) {
        const amt = 0.2
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'zoom', amt: amt })
      }).bind(thisObj)
    }, {
      // pan left
      icon: 'chevron_left',
      label: 'Pan left',
      helpText: 'Pan left',
      handler: (function (cxt) {
        const amt = -0.5
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'scroll', delta: amt })
      }).bind(thisObj)
    }, {
      // pan right
      icon: 'chevron_right',
      label: 'Pan right',
      helpText: 'Pan right',
      handler: (function (cxt) {
        const amt = 0.5
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'scroll', delta: amt })
      }).bind(thisObj)
    }, {
      // make reference
      icon: 'check',
      label: 'Reference region',
      helpText: 'Make this the reference region.',
      handler: (function (cxt) {
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'make-reference' })
      }).bind(thisObj)
    }, {
      // split
      icon: 'compare',
      label: 'Split',
      helpText: 'Split this region.',
      handler: (function (cxt) {
        const pos = cxt.vm.clientXtoBase(cxt.event.clientX )
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'split', pos: pos })
      }).bind(thisObj)
    }, {
      // delete
      icon: 'delete',
      label: 'Delete',
      helpText: 'Delete this region.',
      handler: (function (cxt) {
        this.$root.$emit('region-change', { vm: cxt.vm, op: 'remove' })
      }).bind(thisObj)
    }]
}

export default getRegionMenu
