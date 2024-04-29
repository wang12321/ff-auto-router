const fs = require('fs')
const fg = require('fast-glob') // 读取文件目录
const prettier = require('prettier') // 处理文件格式

function parsePagesDirectory(
    pages,
    importPrefix,
    routePath,
    layout = '_layout.vue',
    common = 'common'
) {
    const patterns = ['**/*.vue', `!**/${layout}`, `!**/${common}/*.vue`, `!**/${common}/**/*.vue`]
    // 获取所有layout的文件路径
    const layoutPaths = fg.sync(`**/${layout}`, {
        cwd: pages,
        onlyFiles: true
    })

    // 获取所有需要路由配置的文件路径
    const paths = fg.sync(patterns, {
        cwd: pages,
        onlyFiles: true
    })
    const pathsArr = paths.map((p) => p.split('/'))
    const layoutPathsArr = layoutPaths.map((p) => p.split('/'))

    // 生成嵌套目录
    const map = {}
    layoutPathsArr.forEach((path) => {
        const dir = path.slice(0, path.length - 1)
        dir.unshift('rootPathLayoutName')
        setToMap(map, pathToMapPath(path.slice(0, path.length - 1)), path)
    })
    pathsArr.forEach((path) => {
        let dir = path
        if (path.indexOf('index.vue') > -1) {
            dir = path.slice(0, path.length - 1)
        }
        setToMap(map, pathToMapPath(dir), path)
    })
    //  将目录匹配生成路由json
    const routerJson = pathMapToMeta(
        map.children,
        [],
        pages,
        importPrefix
    )
    const routes = createRoutes(routerJson)
    return { routes }
}

/**
 * 将目录生成嵌套树 将每个目录生成key:{value:[],childer:[]}
 * @param map {}
 * @param paths 不带.vue的路径
 * @param value 所有解析处理的层级目录数组
 */

function setToMap(map, paths, value) {
    const target = paths.reduce((item, key) => {
        if (!item.children) {
            item.children = new Map()
        }
        let child = item.children.get(key)
        if (!child) {
            child = {}
            item.children.set(key, child)
        }
        return child
    }, map)
    target.value = value
}

/**
 * 将路径数组 最后一个带有.vue的路径去除
 * @param segments
 * @returns {*}
 */
function pathToMapPath(segments) {
    const last = segments[segments.length - 1]
    return segments.slice(0, -1).concat(basename(last))
}

/**
 * 正则匹配 将.后面的字符串替换为空字符串
 * @param filename
 * @returns {*}
 */
function basename(filename) {
    return filename.replace(/\.[^.]+$/g, '')
}

/**
 *
 * @param children 嵌套目录
 * @param routers 路由
 * @param pages 需要自动生成文件的目录
 * @param importPrefix import 引入页面文件的前缀目录
 * @returns {*[]}
 */
function pathMapToMeta(
    children,
    routers,
    pages,
    importPrefix
) {
    Array.from(children.keys()).forEach((row) => {
        const item = children.get(row)
        // 配置参数
        const router = {
            name: row,
            path:
                row.indexOf('_id') > -1
                    ? row.indexOf('_id') === 0
                        ? row.replace('_', ':')
                        : row.replace('_', '/:')
                    : row,
            component: '',
            redirect: '',
            index: 99,
            meta: `{ title: "${row}", icon: "form"}`,
            children: []
        }

        // 如果value有值，说明可以根据文件路径取meta信息
        if (item && item.value) {
            router.component = importPrefix + '/' + item.value.join('/')
            const file = fs.readFileSync(pages + '/' + item.value.join('/'), 'utf8')
            let metaArr = null

            if(file.includes('meta:')){
                metaArr =  file.match(/meta: {[^{]+\}/g) || file.match(/meta:{[^{]+\}/g)
            }else if(file.includes('meta=')){
                metaArr = file.match(/meta="{[^{]+\}/g)
            }

            if (metaArr) {
                const metaStr = metaArr[0]
                // 匹配meta信息
                let meta = ''
                if (metaStr.indexOf('meta') > -1) {
                    meta = metaStr.substring(metaStr.indexOf('{'), metaStr.indexOf('}') + 1)
                }
                router.meta = meta
                // 匹配排序
                if (metaStr.indexOf('sortIndex') > -1) {
                    const sortIndexAll = metaStr.substring(metaStr.indexOf('sortIndex'), metaStr.indexOf('}'))
                    const sortIndex = sortIndexAll.substring(
                        sortIndexAll.indexOf(':') + 1,
                        sortIndexAll.indexOf(',') > -1 ? sortIndexAll.indexOf(',') : sortIndexAll.length - 1
                    )
                    router.index = Number(sortIndex) * 10
                }
                if (metaStr.indexOf('redirect') > -1) {
                    const redirectALL = metaStr.substring(metaStr.indexOf('redirect'), metaStr.indexOf('}'))
                    router.redirect = redirectALL.substring(
                        redirectALL.indexOf(':') + 1,
                        redirectALL.indexOf(',') > -1 ? redirectALL.indexOf(',') : redirectALL.length - 1
                    )
                }
            }
        }
        // 如果有children 需要遍历循环匹配
        if (item && item.children) {
            router.children = pathMapToMeta(
                item.children,
                router.children,
                pages,
                importPrefix
            )
        }
        routers.push(router)
    })
    return routers
}
/**
 * 将路由json格式化成字符串
 * @param routers 路由json
 * @returns {*}
 */
function createRoutes(routers) {
    pathList = ''
    return routers.map(createRoute)
}

/**
 * 一级路由转换 第一级的时候需要把component换成Layout 如果没有子节点，则需要将父节点复制一份成为子节点，component指向文件路径
 * @param map
 * @returns {string}
 */
let pathList = ''
function createRoute(map) {
    let children
    if (map.children && map.children.length !== 0) {
        pathList = `/${map.path}`
        children = map.children.map(createRouteZJ)
        if (map.redirect && map.redirect.length > 0) {
            return `\n{
      path:'/${map.path}',
      name:'${map.name}p',
      meta:${map.meta},
      index:${map.index},
      redirect: ${map.redirect},
      alwaysShow: false,
      children:[${children}]
    }`
        }
        return `\n{
      path:'/${map.path}',
      name:'${map.name}',
      meta:${map.meta},
      index:${map.index},
      alwaysShow: false,
      children:[${children}]
    }`
    } else {
        // 如果只有一级目录，需要单独处理name 不然会报警告name相同
        children = [
            `\n{
      path:'${map.path}',
      name:'${map.name}',
      meta:${map.meta},
      index:${map.index},
      alwaysShow: false,
      component:() => import('${map.component}')
    }`
        ]
        if (map.redirect && map.redirect.length > 0) {
            return `\n{
      path:'/${map.path}',
      name:'${map.name}p',
      meta:${map.meta},
      index:${map.index},
      redirect: ${map.redirect},
      alwaysShow: false,
      children:[${children}]
    }`
        }
        return `\n{
      path:'/${map.path}',
      name:'${map.name}p',
      meta:${map.meta},
      index:${map.index},
      alwaysShow: false,
      children:[${children}]
    }`
    }
}

/**
 * 二级及以上路由转换
 * @param map json里面的children  子节点里面的path不需要'/'
 * @returns {string}
 * 为了解决带上父级path,暂时使用4级写法，后续优化
 */
let pathListZ = ''
function createRouteZJ(map) {
    let children = []
    pathListZ = ''
    if (map.children) {
        pathListZ += `/${map.path}`
        children = map.children.map(createRouteZJz)
    }
    if (map.component && map.component.length > 0) {
        return `\n{
    path:'${pathList}${pathListZ}',
    name:'${map.name}',
    meta:${map.meta},
    index:${map.index},
    component:() => import('${map.component}'),
    children:[${children}]
    }`
    } else {
        return `[${children}]`
    }
}
let pathListZz = ''
function createRouteZJz(map) {
    let children = []
    pathListZz = ''
    if (map.children) {
        pathListZz += `/${map.path}`
        children = map.children.map(createRouteZJzz)
    }
    if (map.component && map.component.length > 0) {
        return `\n{
    path:'${pathList}${pathListZ}${pathListZz}',
    name:'${map.name}',
    meta:${map.meta},
    index:${map.index},
    component:() => import('${map.component}'),
    children:[${children}]
    }`
    } else {
        return `[${children}]`
    }
}
let pathListZzz = ''
function createRouteZJzz(map) {
    let children = []
    pathListZzz = ''
    if (map.children) {
        pathListZzz += `/${map.path}`
        children = map.children.map(createRouteZJzz)
    }
    if (map.component && map.component.length > 0) {
        return `\n{
    path:'${pathList}${pathListZ}${pathListZz}${pathListZzz}',
    name:'${map.name}',
    meta:${map.meta},
    index:${map.index},
    component:() => import('${map.component}'),
    children:[${children}]
    }`
    } else {
        return `[${children}]`
    }
}
class AutoRouter {
    constructor(options) {
        // 接收传过来的参数
        this.options = options
    }
    autoRouter(){
        let {pages, importPrefix, routePath} = this.options
        const { routes } = parsePagesDirectory(pages, importPrefix, routePath)
        const virtualFileId = routePath || '@virtual-router'
        return {
            name: 'auto-router', // 必须的，将会在 warning 和 error 中显示
            resolveId(id) {
                if (id === virtualFileId) {
                    return virtualFileId
                }
            },
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const { routes } = parsePagesDirectory(pages, `/${pages}`, routePath)
                    if ((req.url).indexOf(virtualFileId) > -1) {
                        res.setHeader('Content-Type', 'application/javascript')
                        res.end(
                            prettier.format(
                                `
              export const routers = [${routes}]
            `,
                                {
                                    parser: 'babel',
                                    semi: false,
                                    singleQuote: true,
                                    trailingComma: 'none' // 处理最后一行不加，的问题
                                }
                            )
                        )
                    } else {
                        next() //执行下一个中间件
                    }
                })
            },
            load(id) {
                if (id === virtualFileId) {
                    return prettier.format(
                        `
          export const routers = [${routes}]
        `,
                        {
                            parser: 'babel',
                            semi: false,
                            singleQuote: true,
                            trailingComma: 'none' // 处理最后一行不加，的问题
                        }
                    )
                }
            }
        }
    }
    parsePages() {
        let {pages, importPrefix, routePath} = this.options
        return parsePagesDirectory(pages, importPrefix, routePath)
    }
}
module.exports = AutoRouter
