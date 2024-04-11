const fs=require("fs"),fg=require("fast-glob"),prettier=require("prettier");function parsePagesDirectory(e,t,r,n="_layout.vue",a="common"){a=["**/*.vue","!**/"+n,`!**/${a}/*.vue`,`!**/${a}/**/*.vue`],n=fg.sync("**/"+n,{cwd:e,onlyFiles:!0}),a=fg.sync(a,{cwd:e,onlyFiles:!0}).map(e=>e.split("/")),n=n.map(e=>e.split("/"));const o={};return n.forEach(e=>{e.slice(0,e.length-1).unshift("rootPathLayoutName"),setToMap(o,pathToMapPath(e.slice(0,e.length-1)),e)}),a.forEach(e=>{let t=e;-1<e.indexOf("index.vue")&&(t=e.slice(0,e.length-1)),setToMap(o,pathToMapPath(t),e)}),{routes:createRoutes(pathMapToMeta(o.children,[],e,t))}}function setToMap(e,t,r){t.reduce((e,t)=>{e.children||(e.children=new Map);let r=e.children.get(t);return r||(r={},e.children.set(t,r)),r},e).value=r}function pathToMapPath(e){var t=e[e.length-1];return e.slice(0,-1).concat(basename(t))}function basename(e){return e.replace(/\.[^.]+$/g,"")}function pathMapToMeta(a,o,i,c){return Array.from(a.keys()).forEach(t=>{var e=a.get(t),t={name:t,path:-1<t.indexOf("_id")?0===t.indexOf("_id")?t.replace("_",":"):t.replace("_","/:"):t,component:"",redirect:"",index:99,meta:`{ title: "${t}", icon: "form"}`,children:[]};if(e&&e.value){t.component=c+"/"+e.value.join("/");var r=fs.readFileSync(i+"/"+e.value.join("/"),"utf8"),r=r.match(/meta: {[^{]+\}/g)||r.match(/meta:{[^{]+\}/g);if(r){var n,r=r[0];let e="";-1<r.indexOf("meta")&&(e=r.substring(r.indexOf("{"),r.indexOf("}")+1)),t.meta=e,-1<r.indexOf("sortIndex")&&(n=(n=r.substring(r.indexOf("sortIndex"),r.indexOf("}"))).substring(n.indexOf(":")+1,-1<n.indexOf(",")?n.indexOf(","):n.length-1),t.index=10*Number(n)),-1<r.indexOf("redirect")&&(n=r.substring(r.indexOf("redirect"),r.indexOf("}")),t.redirect=n.substring(n.indexOf(":")+1,-1<n.indexOf(",")?n.indexOf(","):n.length-1))}}e&&e.children&&(t.children=pathMapToMeta(e.children,t.children,i,c)),o.push(t)}),o}function createRoutes(e){return e.map(createRoute)}function createRoute(e){let t;return e.children&&0!==e.children.length?(t=e.children.map(createRouteZJ),e.redirect&&0<e.redirect.length?`
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
    }`)}function createRouteZJ(e){let t=[];return e.children&&(t=e.children.map(createRouteZJ)),e.component&&0<e.component.length?`
{
    path:'${e.path}',
    name:'${e.name}',
    meta:${e.meta},
    index:${e.index},
    component:() => import('${e.component}'),
    children:[${t}]
    }`:`[${t}]`}class AutoRouter{constructor(e){this.options=e}autoRouter(){let{pages:a,importPrefix:e,routePath:o}=this.options;const t=parsePagesDirectory(a,e,o)["routes"],i=o||"@virtual-router";return{name:"auto-router",resolveId(e){if(e===i)return i},configureServer(e){e.middlewares.use((e,t,r)=>{var n=parsePagesDirectory(a,"/"+a,o)["routes"];-1<e.url.indexOf(i)?(t.setHeader("Content-Type","application/javascript"),t.end(prettier.format(`
                    import Layout from '/src/layout/index.vue'
              export const routers = [${n}]
            `,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"}))):r()})},load(e){if(e===i)return console.log("调用了"),prettier.format(`
                import Layout from '@/layout/index.vue'
          export const routers = [${t}]
        `,{parser:"babel",semi:!1,singleQuote:!0,trailingComma:"none"})}}}parsePages(){var{pages:e,importPrefix:t,routePath:r}=this.options;return parsePagesDirectory(e,t,r)}}module.exports=AutoRouter;