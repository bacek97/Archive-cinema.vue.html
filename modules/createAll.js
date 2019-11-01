// --Store---
import { mdiSvg } from '/modules/svgmdi.min.js'

let userLocale = (window.navigator ? (window.navigator.language ||
  window.navigator.systemLanguage ||
  window.navigator.userLanguage) : "ru")
  .substr(0, 2).toLowerCase();
let fallbackLocale = "ru";
let redirect = `/${fallbackLocale}/url`;

const createStore = () => { return new Vuex.Store({
  state: () => ({
    mdiSvg,
    route: {},
    downloaded: {
      loading: {},
      availableLanguages: [],
      tmdb: {
        movies: {
          details: {},
          genres: {},
          discover: [],
          keywords: []
        },
        img_conf: {
          backdrop_sizes: [
              "w300",
              "w780",
              "w1280",
              "original",
              "w1400_and_h450_face"
          ],
          logo_sizes: [
              "w45",
              "w92",
              "w154",
              "w185",
              "w300",
              "w500",
              "original"
          ],
          poster_sizes: [
              "w92",
              "w154",
              "w185",
              "w342",
              "w500",
              "w780",
              "original",
              "w300_and_h450_bestv2"
          ],
          profile_sizes: [
              "w45",
              "w185",
              "h632",
              "original",
              "w300_and_h450_bestv2"
          ],
          still_sizes: [
              "w92",
              "w185",
              "w300",
              "original"
          ],
          filters: [
            "_filter(blur)"
          ]
      },
      },
      items: [
        { icon: mdiSvg.mdiContacts, text: 'Личный кабинет', to: {path: "/ru/movie/466272"} },
      ],
    },
    data: {
      boolean: false,
      title: 'Матрица (2010) - Фильм',
      availableLanguages: ["ru", "en"],
      
      nonStrict: {
        tab: 'tab-1',
        cards: {
          flat: false,
          // media: true,
          loading: false,
          actions: true,
          outlined: false,
          elevation: undefined,
          raised: false,
          width: undefined,
          height: "100%",
        },
        vueGrid: {
          cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
          colNum: 12,
          rowHeight:50,
          isDraggable:true,
          isResizable:true,
          isMirrored:false,
          margin:[10, 10],
          verticalCompact:false,
          useCssTransforms:true,
          isResponsive:true,
          layout: [
            {"x":0,"y":0,"w":8,"h":8,"i":1,"minW":5,},
          ],
        },
        lkTable: {

        },
        myArray: [
          {id:1,name:'one'},
          {id:2,name:'two'}
        ],
        dialog: false,
        primaryDrawer: {
          types: ['Default (no property)', 'Permanent', 'Temporary'],
          type: 'default (no property)',
          model: null,
          clipped: true,
          floating: false,
          mini: true,
        },
        footer: {
          inset: false,
        },
      }
    }
  }),
  getters: {
  },
  mutations: {
    stQueryParse(state, payload) {
      Vue.set(state, "route", payload);
    },
    
    write2state(state, { to, data }) {
      Vue.set(state, to, data);
    },
    
    startLoading(state, n) {
      if (state.downloaded.loading[n] === undefined)
        Vue.set(state.downloaded.loading, n, 1);
      else
        Vue.set(state.downloaded.loading, n, state.downloaded.loading[n] + 1);
    },
    percentLoading(state, {n,p}) {
      Vue.set(state.downloaded.loading, n, state.downloaded.loading[n] - 1);
    },
    finishLoading(state, n) {
      Vue.set(state.downloaded.loading, n, state.downloaded.loading[n] - 1);
    },
    updateData(state, { to, json }) {
      Vue.set(state.downloaded, to, json);
    },
    movieDetailsPlus(state, { to, json }) {
      Vue.set(state.downloaded.tmdb.movies.details, json.id, json);
    },
    
  },
  actions: {
    
    async loadData({ commit }, payload) {
      commit("startLoading", payload.i || 0);
      try {
        (await Promise.all(payload.urls.map((async str=> {
          let response = await fetch(str)
          const reader = response.body.getReader();

          // Шаг 2: получаем длину содержимого ответа
          const contentLength = +response.headers.get('Content-Length');
          let percent
          // Шаг 3: считываем данные:
          let receivedLength = 0; // количество байт, полученных на данный момент
          let chunks = []; // массив полученных двоичных фрагментов (составляющих тело ответа)
          while(true) {
            const {done, value} = await reader.read();

            if (done) {
              break;
            }

            chunks.push(value);
            receivedLength += value.length;

            if (contentLength) { 
              percent = receivedLength/contentLength*100
              commit("percentLoading", { n: payload.i || 0, p: percent});
            }
          }

          // Шаг 4: соединим фрагменты в общий типизированный массив Uint8Array
          let chunksAll = new Uint8Array(receivedLength); // (4.1)
          let position = 0;
          for(let chunk of chunks) {
            chunksAll.set(chunk, position); // (4.2)
            position += chunk.length;
          }
          if (str.slice(-3) === ".gz") chunksAll = pako.ungzip(chunksAll)

          // Шаг 5: декодируем Uint8Array обратно в строку
          let result = new TextDecoder("utf-8").decode(chunksAll);

          if (!(str.slice(-3) === ".gz")) return JSON.parse(result)
          return result.split('\n').reduce((acc, line) => {
            if (typeof acc === 'string' || acc instanceof String) acc = JSON.parse(acc)
            if (line) {
              let obj = JSON.parse(line);
              acc[obj.id] = obj.name;
            }
            return acc;
          })
        })))).forEach(
          (json, index) => {
            commit(payload.mut || "updateData", {
              to: payload.to[index],
              json,
              payload
            });
          }
        );
      } catch (error) {
        console.error(error);
      } finally {
        commit("finishLoading", payload.i || 0);
      }
    },
    async loadLangs({ state }, {i18n, to}) {
      if (to.fullPath === "/") return `/${userLocale}/`
      let lang = to.params.language
      if (!state.downloaded.availableLanguages.length)
           state.downloaded.availableLanguages = await fetch(`/modules/langs/array.json`).then(res => res.json())
      if (!i18n.messages[lang])
        if (state.downloaded.availableLanguages.includes(lang))
          i18n.setLocaleMessage(lang, await fetch(`/modules/langs/${lang}.json`).then(res => res.json()));
        // else return to.fullPath.replace(/(\/)(.*?)(\/.*?$|$)/gm, '$1'+i18n.fallbackLocale+'$3')
        else return to.fullPath.replace(/\w+/, i18n.fallbackLocale)
      if (!(i18n.locale === lang) && i18n.messages[lang])
        document.body.parentElement.setAttribute('lang', i18n.locale = lang)
      return true
    }

  }
}) }

// ---Router---
const componentUrl = () => Promise.resolve(componentDownload('componentUrl'))
const componentLK = () => Promise.resolve(componentDownload('componentLK'))
const componentMovie = () => Promise.resolve(componentDownload('componentMovie'))
const createRouter = () => { 
  return new VueRouter({
        mode: "history", // commented if simple.html
        routes: [
          {
            path: "/:language",
            component:  { template: "<router-view ref='rV'></router-view>" },
            children: [
              { path: "", beforeEnter: (to, from, next) => next({name: "url", params: to.params}) },
              { path: "url", name: "url", component: componentUrl },
              { path: "user/:user", name: "lk", component: componentLK },
              { path: "movie/:movie", name: "movie", component: componentMovie },
              // { path: 'tv/:show', name: 'TV', component: movies },
              { path: "*", component: { template: "<div>404</div>" } }
            ]
          }
        ],
        scrollBehavior (to, from, savedPosition) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve({ x: 0, y: 0 })
            }, 500)
          })
        }
      }) }

// ---I18n---
const createI18n = () => new VueI18n({ fallbackLocale })

// ---Vuetify---
const createVuetify = () => { return new Vuetify({
  breakpoint: {
    thresholds: {
      xs: 480,
      sm: 1008,
      md: 1904,
      lg: 3824,
    },
    scrollBarWidth: 24,
  },
  icons: {
    iconfont: 'mdiSvg'
  },
  theme: {
    options: {
      customProperties: true,
      cspNonce: 'dQw4w9WgXcQ'
    },
    dark: true,
    // themes: {
    //   light: {
    //     primary: '#1976D2',
    //     secondary: '#424242',
    //     accent: '#82B1FF',
    //     error: '#FF5252',
    //     info: '#2196F3',
    //     success: '#4CAF50',
    //     warning: '#FFC107'
    //   },
    //   dark: {
    //     primary: "#004D40",
    //     error: "#B71C1C",
    //     info: "#0D47A1",
    //     accent: "#004D40",
    //     secondary: "#424242",
    //     success: "#1B5E20",
    //     warning: "#EF6C00"
    //   }
    // }
  }
})
}

export {createStore, createRouter, createI18n, createVuetify}