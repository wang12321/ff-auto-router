const fs=require("fs"),path=require("path"),pluginName="AutoRouter",fg=require("fast-glob"),prettier=require("prettier");class AutoRouter{constructor(e){this.options=e}apply(e){const t=()=>{const e=generateRoutes(this.options);let t;t=this.options.routePath?path.join(process.cwd(),this.options.routePath):path.join(__dirname,"./routes.js"),fs.existsSync(t)&&fs.readFileSync(t,"utf8").trim()===e.trim()||fs.writeFileSync(t,e)};let o=null;e.hooks.afterPlugins.tap(pluginName,()=>{t()}),e.hooks.emit.tap(pluginName,()=>{const e=require("chokidar");o=e.watch(path.join(process.cwd(),this.options.pages||"src/views/**/*.vue"),{persistent:!0}).on("change",()=>{t()})}),e.hooks.watchClose.tap(pluginName,()=>{o&&(o.close(),o=null)})}}function generateRoutes({pages:e="src/views",importPrefix:t="@/views/",common:o="common"}){o=["**/*.vue",`!**/${o}/*.vue`];const n=fg.sync(o,{cwd:e,onlyFiles:!0});return createRoutes(pathMapToMeta({routers:[],pathArr:n.map(e=>-1<e.indexOf("/index.vue")?e.substring(0,e.indexOf("/index.vue")):-1<e.indexOf(".vue")?e.substring(0,e.indexOf(".vue")):e),paths:n,pages:e,importPrefix:t}))}function createRoutes(e){e=e.map(createRoute);return prettier.format(`import Layout from '@/layout'
export default [

    {
    path: '/',
    component: Layout,
    children:[

    ${e}
    
]
    }
  
]`,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"})}function createRoute(e,t=0){return`
{
      path:'${e.path}',
      name:'${e.name}',
      meta:${e.meta},
      index:${e.index},
      component:() => import('${e.component}')
    }`}function pathMapToMeta({routers:a=[],pathArr:e,paths:s,pages:p,importPrefix:u}){return e.forEach((t,e)=>{var o=t.split("/")||[],o=o&&0<o.length?o[o.length-1]:"",e=s[e]||"";const n={name:o,path:-1<t.indexOf("_id")?0===t.indexOf("_id")?t.replace("_",":"):t.replace("_","/:"):t,component:u+"/"+e,meta:`{ title: "${o}" }`},r=fs.readFileSync(p+"/"+e,"utf8");t=r.match(/\meta: {[^\{]+\}/g)||r.match(/\meta:{[^\{]+\}/g);if(t){const i=t[0];let e="";-1<i.indexOf("meta")&&(e=i.substring(i.indexOf("{"),i.indexOf("}")+1)),n.meta=e}a.push(n)}),a}module.exports=AutoRouter;