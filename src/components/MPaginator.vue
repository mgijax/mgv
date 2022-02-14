<template>
  <div class="m-paginator flexcolumn">
      <div class="flexrow">
          <i class="material-icons button unselectable-text" @click="gotoFirst">first_page</i>
          <i class="material-icons button unselectable-text" @click="gotoPrev">chevron_left</i>
          <div class="flexrow">
              <span>Page</span>
              <input name="pageNum" v-model.number.lazy="pageNum" min="1" />
              <span>of {{ numPages }}</span>
          </div>
          <i class="material-icons button unselectable-text" @click="gotoNext">chevron_right</i>
          <i class="material-icons button unselectable-text" @click="gotoLast">last_page</i>
      </div>
      <div class="flexrow">
          <span>Showing rows {{ currItemStart + 1 }} to {{ currItemEnd + 1 }} of {{ itemCount }}.</span>
          <div class="flexrow">
              <span>PageSize</span>
              <!-- <input name="pageSize" type="number" v-model="pageSize" min="1" /> -->
              <select name="pageSize" v-model.number="pageSize">
                  <option v-for="(ps,psi) in pageSizes"
                      :key="'ps.'+psi"
                      :value="ps"
                      >{{ ps }}</option>
              </select>
          </div>
      </div>
  </div>
</template>

<script>
import MComponent from '@/components/MComponent'
export default MComponent({
  name: 'MPaginator',
  props: [
      'itemCount',
      'defaultPageSize'
  ],
  data: function () {
      return {
          pageSize: this.defaultPageSize,
          pageNum: 1,
          pageSizes: [10, 50, 100, 250, 500]
      }
  },
  computed: {
      numPages () {
          if (this.itemCount === 0) return 0
          return Math.floor((this.itemCount - 1) / this.pageSize) + 1
      },
      currItemStart () {
          return (this.pageNum - 1) * this.pageSize
      },
      currItemEnd () {
          return Math.min(this.pageNum * this.pageSize - 1, this.itemCount - 1)
      },
      currState () {
          return `${this.itemCount}|${this.pageSize}|${this.pageNum}`
      }
  },
  watch: {
      pageSize: function (psNew, psOld) {
          const i = (this.pageNum - 1) * psOld
          this.pageNum = Math.floor(i / psNew) + 1
          if (isNaN(this.pageNum)) this.pageNum = 1
      },
      itemCount () {
          this.pageNum = Math.min(this.pageNum, this.numPages)
      },
      currState () {
          this.announce()
      }
  },
  mounted: function () {
      this.announce()
  },
  methods: {
      announce () {
          this.$emit('m-paginator-changed', { 
              pageSize: this.pageSize,
              pageNum: this.pageNum,
              startIndex: this.currItemStart,
              endIndex: this.currItemEnd
          })
      },
      reset () {
          this.pageSize = this.defaultPageSize
          this.pageNum = 1
      },
      gotoFirst () {
          this.pageNum = 1
      },
      gotoPrev () {
          this.pageNum = Math.max(1, this.pageNum - 1)
      },
      gotoNext () {
          this.pageNum = Math.min(this.numPages, this.pageNum + 1)
      },
      gotoLast () {
          this.pageNum = this.numPages
      }
  }
})
</script>

<style scoped>
.m-paginator {
    flex-grow: 0;
    font-size: 12px;
}
.m-paginator * {
    flex-grow: 0;
}
.button {
    cursor: pointer;
}
input[name="pageNum"] {
    width: 40px;
}
input[name="pageSize"] {
    width: 40px;
}
</style>
