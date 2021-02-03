<template>
  <g class="message-box">
    <!-- Icon -->
    <g>
        <rect
          :x="0"
          :y="-iconSize"
          :width="iconSize + 2"
          :height="iconSize"
          :fill="iconBackground || '#eee'"
          :stroke="iconBorder || 'none'"
          />
        <text
          :x="1"
          :y="-1"
          :fill="iconColor || 'black'"
          :font-size="iconSize"
          >{{ icon }}</text>
        <title v-if="title">{{title}}</title>
    </g>

    <!-- Message -->
    <g 
        :transform="`translate(${mTranslateAmount}, 0)`"
        >
        <clipPath id="myClip" >
          <rect
            :x="0"
            :y="-messageSize-2"
            :width="width - mTranslateAmount"
            :height="messageSize + 4"
          />
        </clipPath>  
        <rect
          :x="0"
          :y="-messageSize-2"
          :width="width - mTranslateAmount"
          :height="messageSize + 4"
          :fill="messageBackground || '#eee'"
          :stroke="messageBorder || 'none'"
          />
        <text
          :x="-textDelta"
          :y="-1"
          clip-path="url(#myClip)"
          @mouseover="startscroll"
          @mouseout="stopscroll"
          :font-size="messageSize"
          :fill="messageColor || 'black'"
          ref="tspan"
          >{{message}}</text>
     </g>
  </g>
</template>

<script>
import MComponent from '@/components/MComponent'
//import u from '@/lib/utils'
export default MComponent({
  name: 'MessageBox',
  props: [
    'width',
    'message',
    'title',

    'icon',
    'iconColor',
    'iconBackground',
    'iconSize',
    'iconBorder',

    'messageSize',
    'messageBackground',
    'messageBorder',
    'messageColor',
    'messageSize'
    ],
  data : function () {
      return {
          textDelta: 0
      }
  },
  computed: {
      mTranslateAmount: function () {
          return 1.5 * this.iconSize
      }
  },
  methods: {
    startscroll: function () {
       const bbox = this.$refs.tspan.getBoundingClientRect()
       if (bbox.width <= this.width) return
       let pause = 0
       this.interval = window.setInterval(() => {
           const d = bbox.width - this.width - this.textDelta + this.mTranslateAmount + 6
           if (d < 0) {
               this.textDelta = 0
               pause = 500
           } else {
               this.textDelta += (pause > 0 ? 0 : 1)
               pause -= 25
           }
       }, 25)
    },
    stopscroll: function () {
       if (this.interval) window.clearInterval(this.interval)
       this.interval = null
    }
  }
})
</script>

<style scoped>
.message-box > text > tspan {
    transition: dx 0.5s;
}
</style>
