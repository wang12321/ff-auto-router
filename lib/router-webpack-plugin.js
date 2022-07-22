const fs=require("fs"),path=require("path"),pluginName="AutoRouter",fg=require("fast-glob"),prettier=require("prettier");class AutoRouter{constructor(e){this.options=e}apply(e){const t=()=>{const e=generateRoutes(this.options);let t;t=this.options.routePath?path.join(process.cwd(),this.options.routePath):(console.log("routespath",path.join(__dirname,"./routes.js")),path.join(__dirname,"./routes.js")),fs.existsSync(t)&&fs.readFileSync(t,"utf8").trim()===e.trim()||fs.writeFileSync(t,e)};let n=null;e.hooks.afterPlugins.tap(pluginName,()=>{t()}),e.hooks.emit.tap(pluginName,()=>{if(console.log("process.env.NODE_ENV",process.env.NODE_ENV),-1<process.env.NODE_ENV.indexOf("development")){const e=require("chokidar");console.log("path",path.join(process.cwd(),this.options.pages||"src/views/**/*.vue")),n=e.watch(path.join(process.cwd(),this.options.pages||"src/views/**/*.vue"),{persistent:!0}).on("all",()=>{t()})}}),e.hooks.watchClose.tap(pluginName,()=>{n&&(n.close(),n=null)})}}function generateRoutes({pages:e="src/views",importPrefix:t="@/views/",layout:n="_layout.vue",common:o="common"}){o=["**/*.vue","!**/"+n,`!**/${o}/*.vue`,`!**/${o}/**/*.vue`];const a=fg.sync("**/"+n,{cwd:e,onlyFiles:!0}),i=fg.sync(o,{cwd:e,onlyFiles:!0}),r=i.map(e=>e.split("/")),s=a.map(e=>e.split("/")),c={};return s.forEach(e=>{const t=e.slice(0,e.length-1);t.unshift("rootPathLayoutName"),setToMap(c,pathToMapPath(e.slice(0,e.length-1)),e)}),r.forEach(e=>{let t=e;-1<e.indexOf("index.vue")&&(t=e.slice(0,e.length-1)),setToMap(c,pathToMapPath(t),e)}),createRoutes(pathMapToMeta({children:c.children,routers:[],pages:e,importPrefix:t}))}function createRoutes(e){e=e.map(createRoute);return prettier.format(`import Layout from '@/layout'
export default [

    ${e}
  
]`,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"})}function createRoute(e,t={}){return e.children&&0!==e.children.length?(t=e.children.map(createRouteZJ),e.redirect&&0<e.redirect.length?`
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
    }`:t}function setToMap(e,t,n){const o=t.reduce((e,t)=>{e.children||(e.children=new Map);let n=e.children.get(t);return n||(n={},e.children.set(t,n)),n},e);o.value=n}function pathToMapPath(e){var t=e[e.length-1];return e.slice(0,-1).concat(basename(t))}function basename(e){return e.replace(/\.[^.]+$/g,"")}function pathMapToMeta({children:s,routers:c=[],pages:p,importPrefix:l}){return Array.from(s.keys()).forEach(t=>{const e=s.get(t),n={name:t,path:-1<t.indexOf("_id")?0===t.indexOf("_id")?t.replace("_",":"):t.replace("_","/:"):t,component:"",index:99,meta:`{ title: "${t}", icon: "form"}`,children:[]};if(e.value){n.component=l+"/"+e.value.join("/");const o=fs.readFileSync(p+"/"+e.value.join("/"),"utf8");t=o.match(/\meta: {[^\{]+\}/g)||o.match(/\meta:{[^\{]+\}/g);if(t){const a=t[0];let e="";if(-1<a.indexOf("meta")&&(e=a.substring(a.indexOf("{"),a.indexOf("}")+1)),n.meta=e,-1<a.indexOf("sortIndex")){const i=a.substring(a.indexOf("sortIndex"),a.indexOf("}"));t=i.substring(i.indexOf(":")+1,-1<i.indexOf(",")?i.indexOf(","):i.length-1);n.index=10*Number(t)}if(-1<a.indexOf("redirect")){const r=a.substring(a.indexOf("redirect"),a.indexOf("}"));n.redirect=r.substring(r.indexOf(":")+1,-1<r.indexOf(",")?r.indexOf(","):r.length-1)}}}e.children&&(n.children=pathMapToMeta({children:e.children,routers:n.children,pages:p,importPrefix:l})),c.push(n)}),c}module.exports=AutoRouter;