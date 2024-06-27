const fs=require("fs"),fg=require("fast-glob"),prettier=require("prettier");class AutoRouter{constructor(e){this.options=e}autoRouter(){let{pages:n,importPrefix:e,routePath:t}=this.options;const r=generateRoutes(n,e)["routes"],o=t||"@virtual-router";return{name:"auto-router",resolveId(e){if(e===o)return o},configureServer(e){e.middlewares.use((e,t,r)=>{var a=generateRoutes(n,"/"+n)["routes"];-1<e.url.indexOf(o)?(t.setHeader("Content-Type","application/javascript"),t.end(prettier.format(`
              export const routers = [${a}]
            `,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"}))):r()})},load(e){if(e===o)return prettier.format(`
          export const routers = [${r}]
        `,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"})}}}parsePages(){var{pages:e,importPrefix:t,routePath:r}=this.options;return generateRoutes(e,t,r)}}function generateRoutes(e="src/views",t="@/views/",r="common"){r=["**/*.vue",`!**/${r}/*.vue`],r=fg.sync(r,{cwd:e,onlyFiles:!0});return{routes:createRoutes(pathMapToMeta({routers:[],pathArr:r.map(e=>-1<e.indexOf("/index.vue")?e.substring(0,e.indexOf("/index.vue")):-1<e.indexOf(".vue")?e.substring(0,e.indexOf(".vue")):e),paths:r,pages:e,importPrefix:t}))}}function createRoutes(e){return e.map(createRoute)}function createRoute(e){return`
{
      path:'/${e.path}',
      name:'${e.name}',
      meta:${e.meta},
      index:${e.index},
      component:() => import('${e.component}')
    }`}function pathMapToMeta({routers:n=[],pathArr:e,paths:o,pages:i,importPrefix:s}){return e.forEach((t,r)=>{var e=t.split("/")||[],e=e&&0<e.length?e[e.length-1]:"",r=o[r]||"",t={name:e,path:-1<t.indexOf("_id")?0===t.indexOf("_id")?t.replace("_",":"):t.replace("_","/:"):t,component:s+"/"+r,meta:`{ title: "${e}" }`},e=fs.readFileSync(i+"/"+r,"utf8");let a=null;if(e.includes("meta:")?a=e.match(/meta: {[^{]+\}/g)||e.match(/meta:{[^{]+\}/g):e.includes("meta=")&&(a=e.match(/meta="{[^{]+\}/g)),a){r=a[0];let e="";-1<r.indexOf("meta")&&(e=r.substring(r.indexOf("{"),r.indexOf("}")+1)),t.meta=e}n.push(t)}),n}module.exports=AutoRouter;