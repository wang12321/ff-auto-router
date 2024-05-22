const fs=require("fs"),fg=require("fast-glob"),prettier=require("prettier");function parsePagesDirectory(e,t,n,a="_layout.vue",r="common"){r=["**/*.vue","!**/"+a,`!**/${r}/*.vue`,`!**/${r}/**/*.vue`],a=fg.sync("**/"+a,{cwd:e,onlyFiles:!0}),r=fg.sync(r,{cwd:e,onlyFiles:!0}).map(e=>e.split("/")),a=a.map(e=>e.split("/"));const i={};return a.forEach(e=>{e.slice(0,e.length-1).unshift("rootPathLayoutName"),setToMap(i,pathToMapPath(e.slice(0,e.length-1)),e)}),r.forEach(e=>{let t=e;-1<e.indexOf("index.vue")&&(t=e.slice(0,e.length-1)),setToMap(i,pathToMapPath(t),e)}),{routes:createRoutes(pathMapToMeta(i.children,[],e,t))}}function setToMap(e,t,n){t.reduce((e,t)=>{e.children||(e.children=new Map);let n=e.children.get(t);return n||(n={},e.children.set(t,n)),n},e).value=n}function pathToMapPath(e){var t=e[e.length-1];return e.slice(0,-1).concat(basename(t))}function basename(e){return e.replace(/\.[^.]+$/g,"")}function pathMapToMeta(t,i,o,p){return Array.from(t.keys()).forEach(n=>{var e=t.get(n),n={name:n,path:-1<n.indexOf("_id")?0===n.indexOf("_id")?n.replace("_",":"):n.replace("_","/:"):n,component:"",redirect:"",index:99,meta:`{ title: "${n}", icon: "form"}`,children:[]};if(e&&e.value){n.component=p+"/"+e.value.join("/");var a=fs.readFileSync(o+"/"+e.value.join("/"),"utf8");let t=null;if(a.includes("meta:")?t=a.match(/meta: {[^{]+\}/g)||a.match(/meta:{[^{]+\}/g):a.includes("meta=")&&(t=a.match(/meta="{[^{]+\}/g)),t){var r,a=t[0];let e="";-1<a.indexOf("meta")&&(e=a.substring(a.indexOf("{"),a.indexOf("}")+1)),n.meta=e,-1<a.indexOf("sortIndex")&&(r=(r=a.substring(a.indexOf("sortIndex"),a.indexOf("}"))).substring(r.indexOf(":")+1,-1<r.indexOf(",")?r.indexOf(","):r.length-1),n.index=10*Number(r)),-1<a.indexOf("redirect")&&(r=a.substring(a.indexOf("redirect"),a.indexOf("}")),n.redirect=r.substring(r.indexOf(":")+1,-1<r.indexOf(",")?r.indexOf(","):r.length-1))}}e&&e.children&&(n.children=pathMapToMeta(e.children,n.children,o,p)),i.push(n)}),i}function createRoutes(e){return pathList="",e.map(createRoute)}let pathList="";function createRoute(e){let t;return e.children&&0!==e.children.length?(pathList="/"+e.path,t=e.children.map(createRouteZJ),e.redirect&&0<e.redirect.length?`
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
      path:'/${e.path}',
      name:'${e.name}',
      meta:${e.meta},
      index:${e.index},
      alwaysShow: false,
      component:() => import('${e.component}')
    }`],e.redirect&&0<e.redirect.length?`
{
      path:'/${e.path}p',
      name:'${e.name}p',
      meta:${e.meta},
      index:${e.index},
      redirect: ${e.redirect},
      alwaysShow: false,
      children:[${t}]
    }`:`
{
      path:'/${e.path}p',
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