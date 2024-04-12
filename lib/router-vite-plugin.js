const fs=require("fs"),fg=require("fast-glob"),prettier=require("prettier");function parsePagesDirectory(e,t,n,a="_layout.vue",r="common"){r=["**/*.vue","!**/"+a,`!**/${r}/*.vue`,`!**/${r}/**/*.vue`],a=fg.sync("**/"+a,{cwd:e,onlyFiles:!0}),r=fg.sync(r,{cwd:e,onlyFiles:!0}).map(e=>e.split("/")),a=a.map(e=>e.split("/"));const i={};return a.forEach(e=>{e.slice(0,e.length-1).unshift("rootPathLayoutName"),setToMap(i,pathToMapPath(e.slice(0,e.length-1)),e)}),r.forEach(e=>{let t=e;-1<e.indexOf("index.vue")&&(t=e.slice(0,e.length-1)),setToMap(i,pathToMapPath(t),e)}),{routes:createRoutes(pathMapToMeta(i.children,[],e,t))}}function setToMap(e,t,n){t.reduce((e,t)=>{e.children||(e.children=new Map);let n=e.children.get(t);return n||(n={},e.children.set(t,n)),n},e).value=n}function pathToMapPath(e){var t=e[e.length-1];return e.slice(0,-1).concat(basename(t))}function basename(e){return e.replace(/\.[^.]+$/g,"")}function pathMapToMeta(r,i,o,p){return Array.from(r.keys()).forEach(t=>{var e=r.get(t),t={name:t,path:-1<t.indexOf("_id")?0===t.indexOf("_id")?t.replace("_",":"):t.replace("_","/:"):t,component:"",redirect:"",index:99,meta:`{ title: "${t}", icon: "form"}`,children:[]};if(e&&e.value){t.component=p+"/"+e.value.join("/");var n=fs.readFileSync(o+"/"+e.value.join("/"),"utf8"),n=n.match(/meta: {[^{]+\}/g)||n.match(/meta:{[^{]+\}/g);if(n){var a,n=n[0];let e="";-1<n.indexOf("meta")&&(e=n.substring(n.indexOf("{"),n.indexOf("}")+1)),t.meta=e,-1<n.indexOf("sortIndex")&&(a=(a=n.substring(n.indexOf("sortIndex"),n.indexOf("}"))).substring(a.indexOf(":")+1,-1<a.indexOf(",")?a.indexOf(","):a.length-1),t.index=10*Number(a)),-1<n.indexOf("redirect")&&(a=n.substring(n.indexOf("redirect"),n.indexOf("}")),t.redirect=a.substring(a.indexOf(":")+1,-1<a.indexOf(",")?a.indexOf(","):a.length-1))}}e&&e.children&&(t.children=pathMapToMeta(e.children,t.children,o,p)),i.push(t)}),i}function createRoutes(e){return pathList="",e.map(createRoute)}let pathList="";function createRoute(e){let t;return e.children&&0!==e.children.length?(pathList="/"+e.path,t=e.children.map(createRouteZJ),e.redirect&&0<e.redirect.length?`
{
      path:'/${e.path}',
      name:'${e.name}p',
      meta:${e.meta},
      index:${e.index},
      redirect: ${e.redirect},
      alwaysShow: false,
      children:[${t}]
    }`:`
{
      path:'/${e.path}',
      name:'${e.name}',
      meta:${e.meta},
      index:${e.index},
      alwaysShow: false,
      children:[${t}]
    }`):(t=[`
{
      path:'${e.path}',
      name:'${e.name}',
      meta:${e.meta},
      index:${e.index},
      alwaysShow: false,
      component:() => import('${e.component}')
    }`],e.redirect&&0<e.redirect.length?`
{
      path:'/${e.path}',
      name:'${e.name}p',
      meta:${e.meta},
      index:${e.index},
      redirect: ${e.redirect},
      alwaysShow: false,
      children:[${t}]
    }`:`
{
      path:'/${e.path}',
      name:'${e.name}p',
      meta:${e.meta},
      index:${e.index},
      alwaysShow: false,
      children:[${t}]
    }`)}let pathListZ="";function createRouteZJ(e){let t=[];return pathListZ="",e.children&&(pathListZ+="/"+e.path,t=e.children.map(createRouteZJz)),e.component&&0<e.component.length?`
{
    path:'${pathList}${pathListZ}',
    name:'${e.name}',
    meta:${e.meta},
    index:${e.index},
    component:() => import('${e.component}'),
    children:[${t}]
    }`:`[${t}]`}let pathListZz="";function createRouteZJz(e){let t=[];return pathListZz="",e.children&&(pathListZz+="/"+e.path,t=e.children.map(createRouteZJzz)),e.component&&0<e.component.length?`
{
    path:'${pathList}${pathListZ}${pathListZz}',
    name:'${e.name}',
    meta:${e.meta},
    index:${e.index},
    component:() => import('${e.component}'),
    children:[${t}]
    }`:`[${t}]`}let pathListZzz="";function createRouteZJzz(e){let t=[];return pathListZzz="",e.children&&(pathListZzz+="/"+e.path,t=e.children.map(createRouteZJzz)),e.component&&0<e.component.length?`
{
    path:'${pathList}${pathListZ}${pathListZz}${pathListZzz}',
    name:'${e.name}',
    meta:${e.meta},
    index:${e.index},
    component:() => import('${e.component}'),
    children:[${t}]
    }`:`[${t}]`}class AutoRouter{constructor(e){this.options=e}autoRouter(){let{pages:r,importPrefix:e,routePath:i}=this.options;const t=parsePagesDirectory(r,e,i)["routes"],o=i||"@virtual-router";return{name:"auto-router",resolveId(e){if(e===o)return o},configureServer(e){e.middlewares.use((e,t,n)=>{var a=parsePagesDirectory(r,"/"+r,i)["routes"];-1<e.url.indexOf(o)?(t.setHeader("Content-Type","application/javascript"),t.end(prettier.format(`
              export const routers = [${a}]
            `,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"}))):n()})},load(e){if(e===o)return prettier.format(`
          export const routers = [${t}]
        `,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"})}}}parsePages(){var{pages:e,importPrefix:t,routePath:n}=this.options;return parsePagesDirectory(e,t,n)}}module.exports=AutoRouter;