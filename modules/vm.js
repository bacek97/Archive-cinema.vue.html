import {createStore, createRouter, createI18n, createVuetify} from './createAll.js'

Vue.mixin({
  data: () => ({

  }),
  computed: {
    ...Vuex.mapState(["data", "downloaded", "mdiSvg"]),
    ...Vuex.mapGetters([])
  },
  methods: {
    ...Vuex.mapActions([
      "loadData"
    ]),
    ...Vuex.mapMutations(["write2state", "stQueryParse"]),
  }
})

const createApp = async () => {
  

const i18n = createI18n()
const store = createStore()
const router = createRouter()
const vuetify = createVuetify()
  
const componentAppBar = () => Promise.resolve( componentDownload("componentAppBar") )
const componentDrawer = () => Promise.resolve( componentDownload("componentDrawer") )
const componentFooter = () => Promise.resolve( componentDownload("componentFooter") )
const componentZContent = () => Promise.resolve( componentDownload("componentZContent") )

  router.beforeEach(async (to, from, next)=>{
    // console.warn((performance.now() - t0) + 'beforeEach')
    store.dispatch('loadLangs',{i18n,to:{...to}}).then(next).catch(() => 42)
  })

  
  const createVm = async (context) => {
   return new Vue({
      i18n, store, router, vuetify,
      components: { componentAppBar, componentDrawer, componentZContent, componentFooter },  // 'component-x': componentX   // <component-x></component-x>
      mounted() {
        // console.warn((performance.now() - t0) + 'MountedVM')
      },
      created() {
        // console.warn((performance.now() - t0) + 'createdVM')
        this.$router.onReady(() => {
          this.$mount('#beforeMountVM')
        })
      },
      render: Vue.compile(`
      <v-app id="mountedVM">
        <component-app-bar></component-app-bar>
        <component-drawer></component-drawer>
        <v-content>
          <router-view ref='rV'></router-view>
        </v-content>
        <component-z-content></component-z-content>
        <component-footer></component-footer>
      </v-app>
      `).render
    })
  }

  const vm = createVm()

  window.vm = await vm
  return { i18n, store, router, vuetify, vm }
}

createApp()