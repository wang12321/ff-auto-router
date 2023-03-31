const fs=require("fs"),path=require("path"),pluginName="AutoRouter",fg=require("fast-glob"),prettier=require("prettier");class AutoRouter{constructor(e){this.options=e}apply(e){const t=()=>{var e=generateRoutes(this.options);let t;t=this.options.routePath?path.join(process.cwd(),this.options.routePath):path.join(__dirname,"./routes.js"),fs.existsSync(t)&&fs.readFileSync(t,"utf8").trim()===e.trim()||fs.writeFileSync(t,e)};let r=null;e.hooks.afterPlugins.tap(pluginName,()=>{t()}),e.hooks.emit.tap(pluginName,()=>{var e=require("chokidar");r=e.watch(path.join(process.cwd(),this.options.pages||"src/views/**/*.vue"),{persistent:!0}).on("change",()=>{t()})}),e.hooks.watchClose.tap(pluginName,()=>{r&&(r.close(),r=null)})}}function generateRoutes({pages:e="src/views",importPrefix:t="@/views/",common:r="common"}){r=["**/*.vue",`!**/${r}/*.vue`],r=fg.sync(r,{cwd:e,onlyFiles:!0});return createRoutes(pathMapToMeta({routers:[],pathArr:r.map(e=>-1<e.indexOf("/index.vue")?e.substring(0,e.indexOf("/index.vue")):-1<e.indexOf(".vue")?e.substring(0,e.indexOf(".vue")):e),paths:r,pages:e,importPrefix:t}))}function createRoutes(e){e=e.map(createRoute);return prettier.format(`import Layout from '@/layout'
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
    }`}function pathMapToMeta({routers:e=[],pathArr:t,paths:i,pages:a,importPrefix:n}){return t.forEach((t,r)=>{var o=t.split("/")||[],o=o&&0<o.length?o[o.length-1]:"",r=i[r]||"",t={name:o,path:-1<t.indexOf("_id")?0===t.indexOf("_id")?t.replace("_",":"):t.replace("_","/:"):t,component:n+"/"+r,meta:`{ title: "${o}" }`},o=fs.readFileSync(a+"/"+r,"utf8"),r=o.match(/\meta: {[^\{]+\}/g)||o.match(/\meta:{[^\{]+\}/g);if(r){o=r[0];let e="";-1<o.indexOf("meta")&&(e=o.substring(o.indexOf("{"),o.indexOf("}")+1)),t.meta=e}e.push(t)}),e}module.exports=AutoRouter;