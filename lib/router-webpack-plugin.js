const fs=require("fs"),path=require("path"),pluginName="AutoRouter",fg=require("fast-glob"),prettier=require("prettier");class AutoRouter{constructor(e){this.options=e}apply(e){const t=()=>{var e=generateRoutes(this.options);let t;t=this.options.routePath?path.join(process.cwd(),this.options.routePath):(console.log("routespath",path.join(__dirname,"./routes.js")),path.join(__dirname,"./routes.js")),fs.existsSync(t)&&fs.readFileSync(t,"utf8").trim()===e.trim()||fs.writeFileSync(t,e)};let n=null;e.hooks.afterPlugins.tap(pluginName,()=>{t()}),e.hooks.emit.tap(pluginName,()=>{var e;console.log("process.env.NODE_ENV",process.env.NODE_ENV),-1<process.env.NODE_ENV.indexOf("development")&&(e=require("chokidar"),console.log("path",path.join(process.cwd(),this.options.pages||"src/views/**/*.vue")),n=e.watch(path.join(process.cwd(),this.options.pages||"src/views/**/*.vue"),{persistent:!0}).on("all",()=>{t()}))}),e.hooks.watchClose.tap(pluginName,()=>{n&&(n.close(),n=null)})}}function generateRoutes({pages:e="src/views",importPrefix:t="@/views/",layout:n="_layout.vue",common:r="common",isApiRouter:o=!1}){r=["**/*.vue","!**/"+n,`!**/${r}/*.vue`,`!**/${r}/**/*.vue`],n=fg.sync("**/"+n,{cwd:e,onlyFiles:!0}),r=fg.sync(r,{cwd:e,onlyFiles:!0}).map(e=>e.split("/")),n=n.map(e=>e.split("/"));const a={};return n.forEach(e=>{e.slice(0,e.length-1).unshift("rootPathLayoutName"),setToMap(a,pathToMapPath(e.slice(0,e.length-1)),e)}),r.forEach(e=>{let t=e;-1<e.indexOf("index.vue")&&(t=e.slice(0,e.length-1)),setToMap(a,pathToMapPath(t),e)}),createRoutes(pathMapToMeta({children:a.children,routers:[],pages:e,importPrefix:t}),o)}function routerUrl(e,t="Layout: () => import('@/layout/index'),"){return e.forEach(e=>{t+=`'${e.name}': () => import('${e.component}'),
    `,e.children&&0!==e.children.length&&(t=routerUrl(e.children,t))}),t}function routerMaps(e){return`
  export const routerUrl = {
  ${routerUrl(e)}
  }
  `}function createRoutes(e,t){var n=e.map(createRoute);let r="";return t&&(r=routerMaps(e),-1<process.env.NODE_ENV.indexOf("production"))?prettier.format(""+r,{parser:"babel",semi:!1,singleQuote:!0,printWidth:500,trailingComma:"none"}):prettier.format(`import Layout from '@/layout'
export default [

    ${n}
  
]
  ${r}
  `,{parser:"babel",semi:!1,singleQuote:!0,printWidth:500,trailingComma:"none"})}function createRoute(e,t={}){return e.children&&0!==e.children.length?(t=e.children.map(createRouteZJ),e.redirect&&0<e.redirect.length?`
{
      path:'/${e.path}',
      name:'${e.name}p',
      meta:${e.meta},
      index:${e.index},
      redirect: ${e.redirect},
      alwaysShow: false,
      component: Layout,
      children:[${t}]
    }`:`
{
      path:'/${e.path}',
      name:'${e.name}',
      meta:${e.meta},
      index:${e.index},
      alwaysShow: false,
      component: Layout,
      children:[${t}]
    }`):(t=`
{
      path:'/${e.path}',
      name:'${e.name}',
      meta:${e.meta},
      index:${e.index},
      alwaysShow: false,
      component:() => import('${e.component}')
    }`,e.redirect&&0<e.redirect.length?`
{
      path:'/${e.path}',
      name:'${e.name}p',
      meta:${e.meta},
      index:${e.index},
      redirect: ${e.redirect},
      alwaysShow: false,
      component: Layout,
      children:[${t}]
    }`:`
{
      path:'/${e.path}',
      name:'${e.name}p',
      meta:${e.meta},
      index:${e.index},
      alwaysShow: false,
      component: Layout,
      children:[${t}]
    }`)}function createRouteZJ(e,t={}){return e.children&&(t=e.children.map(createRouteZJ)),e.component&&0<e.component.length?`
{
    path:'${e.path}',
    name:'${e.name}',
    meta:${e.meta},
    index:${e.index},
    component:() => import('${e.component}'),
    children:[${t}]
    }`:t}function setToMap(e,t,n){t.reduce((e,t)=>{e.children||(e.children=new Map);let n=e.children.get(t);return n||(n={},e.children.set(t,n)),n},e).value=n}function pathToMapPath(e){var t=e[e.length-1];return e.slice(0,-1).concat(basename(t))}function basename(e){return e.replace(/\.[^.]+$/g,"")}function pathMapToMeta({children:o,routers:a=[],pages:i,importPrefix:s}){return Array.from(o.keys()).forEach(t=>{var e=o.get(t),t={name:t,path:-1<t.indexOf("_id")?0===t.indexOf("_id")?t.replace("_",":"):t.replace("_","/:"):t,component:"",index:99,meta:`{ title: "${t}", icon: "form"}`,children:[]};if(e.value){t.component=s+"/"+e.value.join("/");var n=fs.readFileSync(i+"/"+e.value.join("/"),"utf8"),n=n.match(/\meta: {[^\{]+\}/g)||n.match(/\meta:{[^\{]+\}/g);if(n){var r,n=n[0];let e="";-1<n.indexOf("meta")&&(e=n.substring(n.indexOf("{"),n.indexOf("}")+1)),t.meta=e,-1<n.indexOf("sortIndex")&&(r=(r=n.substring(n.indexOf("sortIndex"),n.indexOf("}"))).substring(r.indexOf(":")+1,-1<r.indexOf(",")?r.indexOf(","):r.length-1),t.index=10*Number(r)),-1<n.indexOf("redirect")&&(r=n.substring(n.indexOf("redirect"),n.indexOf("}")),t.redirect=r.substring(r.indexOf(":")+1,-1<r.indexOf(",")?r.indexOf(","):r.length-1))}}e.children&&(t.children=pathMapToMeta({children:e.children,routers:t.children,pages:i,importPrefix:s})),a.push(t)}),a}module.exports=AutoRouter;